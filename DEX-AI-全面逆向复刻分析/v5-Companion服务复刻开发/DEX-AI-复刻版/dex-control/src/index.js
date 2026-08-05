// ============================================================
// DEX AI 控制平面 - 账号/设备管理 + JWT 认证
// 监听 :7445 (HTTP)
// 兼容原版 https://api.liguan.me/mobile-codex
// ============================================================

const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json({ limit: "1mb" }));

// ===== 配置 =====
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
const JWT_ISSUER = "https://api.dex-ai.local/mobile-codex";
const PORT = process.env.PORT || 7445;

// ===== 内存存储 =====
const users = new Map();
const devices = new Map();
const sessions = new Map();

// ===== 工具函数 =====
function generateTokens(userId) {
    const accessToken = jwt.sign(
        { sub: userId, iss: JWT_ISSUER, type: "access" },
        JWT_SECRET,
        { expiresIn: "24h" }
    );
    const refreshToken = jwt.sign(
        { sub: userId, iss: JWT_ISSUER, type: "refresh" },
        JWT_SECRET,
        { expiresIn: "30d" }
    );
    return { accessToken, refreshToken, expiresIn: 86400 };
}

function verifyToken(token) {
    try { return jwt.verify(token, JWT_SECRET); }
    catch { return null; }
}

// ===== 全局超时中间件 =====
app.use((req, res, next) => {
    const timer = setTimeout(() => {
        if (!res.headersSent) {
            res.status(504).json({ error: "请求超时", timeout: true });
        }
    }, 30000);
    res.on("finish", () => clearTimeout(timer));
    next();
});

// ===== 全局错误处理 =====
app.use((err, req, res, next) => {
    console.error("[Error]", err.message);
    if (!res.headersSent) {
        res.status(500).json({ error: err.message || "内部错误" });
    }
});

// ===== API 路由 =====
app.get("/health", (req, res) => {
    res.json({ status: "ok", version: "1.0.0" });
});

app.post("/v1/auth/register", (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "email and password required" });
    }
    if (users.has(email)) {
        return res.status(409).json({ error: "user already exists" });
    }
    const userId = uuidv4();
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    users.set(email, {
        id: userId, email, name: name || email.split("@")[0],
        passwordHash: hash, salt, created: new Date().toISOString(),
    });
    const tokens = generateTokens(userId);
    sessions.set(tokens.accessToken, { userId, email, created: new Date() });
    res.status(201).json({ user: { id: userId, email, name: name || email.split("@")[0] }, ...tokens });
});

app.post("/v1/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    const user = users.get(email);
    if (!user) return res.status(401).json({ error: "invalid credentials" });
    const hash = crypto.pbkdf2Sync(password, user.salt, 100000, 64, "sha512").toString("hex");
    if (hash !== user.passwordHash) return res.status(401).json({ error: "invalid credentials" });
    const tokens = generateTokens(user.id);
    sessions.set(tokens.accessToken, { userId: user.id, email, created: new Date() });
    res.json({ user: { id: user.id, email: user.email, name: user.name }, ...tokens });
});

app.post("/v1/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });
    const decoded = verifyToken(refreshToken);
    if (!decoded || decoded.type !== "refresh") return res.status(401).json({ error: "invalid refresh token" });
    res.json(generateTokens(decoded.sub));
});

app.post("/v1/auth/logout", (req, res) => {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) sessions.delete(auth.slice(7));
    res.json({ success: true });
});

app.get("/v1/auth/me", (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "unauthorized" });
    const decoded = verifyToken(auth.slice(7));
    if (!decoded) return res.status(401).json({ error: "invalid token" });
    for (const [, user] of users) {
        if (user.id === decoded.sub) {
            return res.json({ user: { id: user.id, email: user.email, name: user.name } });
        }
    }
    res.status(404).json({ error: "user not found" });
});

app.post("/v1/devices", (req, res) => {
    const { deviceId, deviceName, deviceType, publicKey } = req.body;
    if (!deviceId) return res.status(400).json({ error: "deviceId required" });
    devices.set(deviceId, {
        id: deviceId, name: deviceName || "Unknown Device", type: deviceType || "desktop",
        publicKey: publicKey || "", registered: new Date().toISOString(),
        lastSeen: new Date().toISOString(), status: "active",
    });
    res.status(201).json({ device: devices.get(deviceId) });
});

app.get("/v1/devices", (req, res) => {
    res.json({ devices: Array.from(devices.values()) });
});

app.delete("/v1/devices/:id", (req, res) => {
    devices.delete(req.params.id);
    res.json({ success: true });
});

app.get("/v1/jwt/public-key", (req, res) => {
    res.json({ publicKey: JWT_SECRET, issuer: JWT_ISSUER });
});

// ===== LLM 代理（带超时控制） =====
const https = require("https");
const http = require("http");

function fetchWithTimeout(urlStr, options = {}, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const transport = url.protocol === "https:" ? https : http;
        const reqOpts = {
            hostname: url.hostname,
            port: url.port || (url.protocol === "https:" ? 443 : 80),
            path: url.pathname + url.search,
            method: options.method || "GET",
            headers: options.headers || {},
        };

        const req = transport.request(reqOpts, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => resolve({ statusCode: res.statusCode, data }));
        });

        req.on("error", (e) => reject(e));
        req.setTimeout(timeoutMs, () => {
            req.destroy(new Error("Connection timeout"));
        });

        if (options.body) req.write(options.body);
        req.end();
    });
}

app.post("/v1/llm/test", express.json(), async (req, res) => {
    try {
        const { apiKey, baseUrl } = req.body;
        if (!apiKey) return res.json({ ok: false, error: "API Key required" });

        const result = await fetchWithTimeout(
            (baseUrl || "https://api.openai.com/v1") + "/models",
            { headers: { "Authorization": "Bearer " + apiKey } },
            8000
        );
        res.json({ ok: result.statusCode === 200, status: result.statusCode });
    } catch (err) {
        res.json({ ok: false, error: err.message || "连接失败" });
    }
});

app.post("/v1/llm/chat", express.json(), async (req, res) => {
    try {
        const { model, messages, apiKey, baseUrl } = req.body;
        if (!apiKey) return res.status(400).json({ error: "API Key required" });

        const body = JSON.stringify({
            model: model || "gpt-3.5-turbo",
            messages: messages || [],
            temperature: 0.7,
            max_tokens: 4096,
            stream: false,
        });

        const result = await fetchWithTimeout(
            (baseUrl || "https://api.openai.com/v1") + "/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + apiKey,
                },
                body: body,
            },
            30000
        );

        try {
            res.json(JSON.parse(result.data));
        } catch {
            res.status(502).json({ error: "parse error", raw: result.data.substring(0, 200) });
        }
    } catch (err) {
        res.status(504).json({ error: err.message || "连接超时" });
    }
});

// ===== 启动服务器 =====
app.listen(PORT, "0.0.0.0", () => {
    console.log("[Control] 控制平面已启动: http://0.0.0.0:" + PORT);
    console.log("[Control] 所有端点已就绪");
});
