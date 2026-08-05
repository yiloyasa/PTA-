const express = require("express");
const path = require("path");
const https = require("https");

const app = express();
const PORT = 7446;

app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.json());

// 代理到 Companion JSON-RPC
app.post("/api/companion", async (req, res) => {
    try {
        const body = JSON.stringify(req.body);
        const options = {
            hostname: "127.0.0.1",
            port: 7443,
            path: "/jsonrpc",
            method: "POST",
            headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
            rejectUnauthorized: false,
        };
        const proxyReq = https.request(options, (proxyRes) => {
            let data = "";
            proxyRes.on("data", (chunk) => data += chunk);
            proxyRes.on("end", () => {
                try { res.json(JSON.parse(data)); } catch { res.status(502).send(data); }
            });
        });
        proxyReq.on("error", (err) => res.status(502).json({ error: err.message }));
        proxyReq.write(body);
        proxyReq.end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 代理到控制平面
app.all("/api/control/*", (req, res) => {
    const http = require("http");
    const targetPath = req.url.replace("/api/control", "");
    const body = JSON.stringify(req.body);
    const options = {
        hostname: "127.0.0.1",
        port: 7445,
        path: targetPath,
        method: req.method,
        headers: { ...req.headers, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body), host: "127.0.0.1:7445" },
    };
    const proxyReq = http.request(options, (proxyRes) => {
        let data = "";
        proxyRes.on("data", (chunk) => data += chunk);
        proxyRes.on("end", () => {
            res.status(proxyRes.statusCode);
            res.set(proxyRes.headers);
            res.send(data);
        });
    });
    proxyReq.on("error", (err) => res.status(502).json({ error: err.message }));
    if (["POST", "PUT", "PATCH"].includes(req.method)) proxyReq.write(body);
    proxyReq.end();
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Web] 管理界面: http://0.0.0.0:${PORT}`);
});
