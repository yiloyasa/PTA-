const express = require("express");
const path = require("path");
const https = require("https");
const http = require("http");

const app = express();
const PORT = 7446;

app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.json({ limit: "1mb" }));

// 工具：带超时的 HTTP 请求
function proxyRequest(targetUrl, method, headers, body, timeoutMs = 15000, insecure = false) {
    return new Promise((resolve, reject) => {
        const url = new URL(targetUrl);
        const transport = url.protocol === "https:" ? https : http;
        const opts = {
            hostname: url.hostname,
            port: url.port || (url.protocol === "https:" ? 443 : 80),
            path: url.pathname + url.search,
            method: method,
            headers: {
                "Content-Type": "application/json",
                ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
            },
        };

        // 自签名证书需要跳过验证
        if (insecure) {
            opts.rejectUnauthorized = false;
        }

        const req = transport.request(opts, (res) => {
            let data = "";
            res.on("data", (chunk) => data += chunk);
            res.on("end", () => resolve({ statusCode: res.statusCode, headers: res.headers, data }));
        });

        req.setTimeout(timeoutMs, () => {
            req.destroy(new Error("代理超时"));
        });
        req.on("error", (err) => reject(err));
        if (body) req.write(body);
        req.end();
    });
}

// 代理到 Companion JSON-RPC（HTTPS，自签名证书）
app.post("/api/companion", async (req, res) => {
    try {
        const body = JSON.stringify(req.body);
        const result = await proxyRequest(
            "https://127.0.0.1:7443/jsonrpc",
            "POST",
            null,
            body,
            10000,
            true  // 跳过证书验证
        );
        try { res.json(JSON.parse(result.data)); }
        catch { res.status(502).send(result.data); }
    } catch (err) {
        console.error("[Companion Proxy]", err.message);
        res.status(502).json({ error: "Companion 离线: " + err.message });
    }
});

// 代理到控制平面（HTTP）
app.all("/api/control/*", async (req, res) => {
    try {
        const targetPath = req.url.replace("/api/control", "");
        const body = ["POST", "PUT", "PATCH"].includes(req.method) ? JSON.stringify(req.body) : null;
        const result = await proxyRequest(
            "http://127.0.0.1:7445" + targetPath,
            req.method,
            null,
            body,
            30000,
            false
        );
        res.status(result.statusCode);
        if (result.headers["content-type"]) {
            res.set("Content-Type", result.headers["content-type"]);
        }
        try {
            const parsed = JSON.parse(result.data);
            res.json(parsed);
        } catch {
            res.send(result.data);
        }
    } catch (err) {
        console.error("[Control Proxy]", err.message);
        res.status(502).json({ error: "控制平面离线: " + err.message });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("[Web] 管理界面: http://0.0.0.0:" + PORT);
});
