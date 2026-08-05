// ============================================================
// DEX AI Companion 服务 - 手机端连接桌面端的桥梁
// 监听 :7443 (HTTPS) 和 :7444 (HTTP Proxy)
// 协议: JSON-RPC 2.0 over WebSocket + HTTPS
// ============================================================

const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const { WebSocketServer } = require('ws');
const { JsonRpcServer } = require('./jsonrpc');
const { AuthManager } = require('./auth');
const { DiscoveryService } = require('./discovery');
const { PluginBridge } = require('./plugin-bridge');

const CONFIG_PATH = process.env.CONFIG_PATH || path.join(__dirname, '..', 'config.json');

// 默认配置
const DEFAULT_CONFIG = {
  listen_addr: '0.0.0.0:7443',
  browser_proxy_addr: '0.0.0.0:7444',
  auth_token: '',
  device_id: '',
  account_id: '',
  tls_cert: '',
  tls_key: '',
  control_plane_url: 'https://api.liguan.me/mobile-codex',
  headscale_login_server: 'https://headscale.dex.liguan.me',
};

class CompanionServer {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.app = express();
    this.jsonRpc = new JsonRpcServer();
    this.auth = new AuthManager();
    this.discovery = new DiscoveryService();
    this.pluginBridge = new PluginBridge();
    this.llm = null; // LLM 服务（延迟初始化）
    this.server = null;
    this.wss = null;
  }

  async loadConfig() {
    try {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      this.config = { ...DEFAULT_CONFIG, ...JSON.parse(data) };
      console.log('[Config] 配置已加载');
    } catch (err) {
      console.log('[Config] 使用默认配置');
      this.config.device_id = require('uuid').v4();
    }
  }

  async generateCert() {
    const certDir = path.join(__dirname, "..", "certs");
    const certPath = path.join(certDir, "server.crt");
    const keyPath = path.join(certDir, "server.key");

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      console.log("[TLS] 使用已有证书");
      return {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      };
    }

    console.log("[TLS] 生成自签名证书...");
    fs.mkdirSync(certDir, { recursive: true });

    // 使用 node-forge 纯 JS 生成自签名证书
    try {
      const forge = require("node-forge");
      
      console.log("[TLS] 生成 RSA 2048 密钥对...");
      const keys = forge.pki.rsa.generateKeyPair(2048);
      
      const cert = forge.pki.createCertificate();
      cert.publicKey = keys.publicKey;
      cert.serialNumber = "01" + require("crypto").randomBytes(8).toString("hex");
      
      const now = new Date();
      cert.validity.notBefore = now;
      cert.validity.notAfter = new Date(now.getTime() + 365 * 20 * 24 * 60 * 60 * 1000);
      
      const attrs = [
        { name: "commonName", value: "Mobile Codex Companion" },
        { name: "organizationName", value: "DEX AI" },
        { name: "countryName", value: "CN" },
      ];
      cert.setSubject(attrs);
      cert.setIssuer(attrs);
      
      cert.setExtensions([
        { name: "basicConstraints", cA: false },
        { name: "keyUsage", keyCertSign: true, digitalSignature: true, keyEncipherment: true },
        { name: "extKeyUsage", serverAuth: true, clientAuth: true },
        { name: "subjectAltName", altNames: [{ type: 2, value: "localhost" }, { type: 2, value: "127.0.0.1" }] },
      ]);
      
      cert.sign(keys.privateKey, forge.md.sha256.create());
      
      const certPem = forge.pki.certificateToPem(cert);
      const keyPem = forge.pki.privateKeyToPem(keys.privateKey);
      
      fs.writeFileSync(certPath, certPem);
      fs.writeFileSync(keyPath, keyPem);
      
      console.log("[TLS] 证书已生成（node-forge）");
      return { cert: certPem, key: keyPem };
    } catch (err) {
      console.error("[TLS] 证书生成失败:", err.message);
      throw err;
    }
  }


  setupRoutes() {
    // JSON-RPC over HTTP
    this.app.post('/jsonrpc', express.json(), (req, res) => {
      this.handleJsonRpc(req.body, req, res);
    });

    // WebSocket 升级
    this.app.get('/ws', (req, res) => {
      res.status(426).json({ error: 'Upgrade Required', message: 'Use WebSocket' });
    });

    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', device_id: this.config.device_id });
    });

    // 本地 API (兼容原版)
    this.app.get('/localapi/v0/prefs', (req, res) => {
      res.json({
        device_id: this.config.device_id,
        account_id: this.config.account_id,
        version: '1.0.0',
      });
    });

    this.app.post('/localapi/v0/start', (req, res) => {
      res.json({ status: 'started' });
    });
  }

  setupWebSocket(server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws, req) => {
      console.log(`[WS] 客户端连接: ${req.socket.remoteAddress}`);

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleJsonRpc(msg, null, null, ws);
        } catch (err) {
          ws.send(JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: 'Parse error' },
          }));
        }
      });

      ws.on('close', () => {
        console.log('[WS] 客户端断开');
      });
    });
  }

  async handleJsonRpc(msg, req, res, ws) {
    if (!msg || !msg.jsonrpc || msg.jsonrpc !== '2.0') {
      const error = { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } };
      if (res) return res.status(400).json(error);
      if (ws) return ws.send(JSON.stringify(error));
      return;
    }

    // 通知消息（无 id）- 直接处理
    if (msg.id === undefined || msg.id === null) {
      await this.jsonRpc.handleNotification(msg);
      return;
    }

    // 请求消息（有 id）
    try {
      const result = await this.jsonRpc.handleRequest(msg);
      const response = { jsonrpc: '2.0', id: msg.id, result };
      if (res) return res.json(response);
      if (ws) return ws.send(JSON.stringify(response));
    } catch (err) {
      const error = {
        jsonrpc: '2.0',
        id: msg.id,
        error: { code: -32603, message: err.message || 'Internal error' },
      };
      if (res) return res.status(500).json(error);
      if (ws) return ws.send(JSON.stringify(error));
    }
  }

  async start() {
    await this.loadConfig();

    // 加载协议处理器（自动生成）
    this.jsonRpc.loadHandlers(path.join(__dirname, 'handlers'));

    // 初始化 LLM 服务
    try {
      const { LlmService } = require('./llm');
      this.llm = new LlmService();
      console.log('[LLM] LLM 服务已初始化');
    } catch (err) {
      console.warn('[LLM] LLM 服务初始化失败:', err.message);
    }

    // 加载自动生成的 126 个 RPC 方法
    try {
      const { RpcHandlers } = require('./handlers');
      const rpcHandlers = new RpcHandlers(this);
      const methods = rpcHandlers.getMethods();
      for (const [method, handler] of Object.entries(methods)) {
        this.jsonRpc.register(method, handler);
      }
      console.log(`[RPC] 已注册 ${Object.keys(methods).length} 个方法`);
    } catch (err) {
      console.error('[RPC] 加载处理器失败:', err.message);
    }

    // 启动 mDNS 发现
    this.discovery.start(this.config);

    // 启动插件桥接
    await this.pluginBridge.start();

    // 设置 HTTP 路由
    this.setupRoutes();

    // 生成 TLS 证书
    const tls = await this.generateCert();

    // 启动 HTTPS 服务器
    const [host, port] = this.config.listen_addr.split(':');
    this.server = https.createServer(tls, this.app);
    this.setupWebSocket(this.server);

    return new Promise((resolve) => {
      this.server.listen(parseInt(port), host, () => {
        console.log(`[Server] Companion 服务已启动: https://${host}:${port}`);
        console.log(`[Server] WebSocket: wss://${host}:${port}/ws`);
        console.log(`[Server] 设备ID: ${this.config.device_id}`);
        resolve();
      });
    });
  }

  stop() {
    if (this.discovery) this.discovery.stop();
    if (this.wss) this.wss.close();
    if (this.server) this.server.close();
    if (this.pluginBridge) this.pluginBridge.stop();
    console.log('[Server] 服务已停止');
  }
}

// 启动
if (require.main === module) {
  const server = new CompanionServer();
  server.start().catch((err) => {
    console.error('[Server] 启动失败:', err);
    process.exit(1);
  });

  // 优雅退出
  process.on('SIGINT', () => { server.stop(); process.exit(0); });
  process.on('SIGTERM', () => { server.stop(); process.exit(0); });
}

module.exports = { CompanionServer };


