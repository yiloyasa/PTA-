// ============================================================
// 插件桥接 - 与桌面端插件通信 (JSON-RPC over stdio)
// ============================================================

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class PluginBridge {
  constructor() {
    this.plugins = new Map();
    this.handlers = new Map();
  }

  async start() {
    // 扫描插件目录
    const pluginsDir = path.join(__dirname, '..', '..', 'plugins');
    if (!fs.existsSync(pluginsDir)) {
      console.log('[Bridge] 插件目录不存在，跳过');
      return;
    }

    const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginJsonPath = path.join(pluginsDir, entry.name, 'plugin.json');
        if (fs.existsSync(pluginJsonPath)) {
          await this.loadPlugin(entry.name, pluginJsonPath);
        }
      }
    }
    console.log(`[Bridge] 已加载 ${this.plugins.size} 个插件`);
  }

  async loadPlugin(name, pluginJsonPath) {
    try {
      const config = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8'));
      console.log(`[Bridge] 发现插件: ${config.name || name} (${config.entry?.runtime || 'unknown'})`);
      this.plugins.set(name, { config, process: null });
    } catch (err) {
      console.warn(`[Bridge] 插件加载失败: ${name}: ${err.message}`);
    }
  }

  registerHandler(method, handler) {
    this.handlers.set(method, handler);
  }

  async callHandler(method, params) {
    const handler = this.handlers.get(method);
    if (handler) {
      return await handler(params);
    }
    throw new Error(`Handler not found: ${method}`);
  }

  stop() {
    for (const [name, plugin] of this.plugins) {
      if (plugin.process) {
        plugin.process.kill();
        console.log(`[Bridge] 已停止插件: ${name}`);
      }
    }
  }
}

module.exports = { PluginBridge };
