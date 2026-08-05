// ============================================================
// DEX AI 核心引擎
// 管理插件生命周期 + JSON-RPC 通信
// ============================================================

const PluginManager = require('./plugin-manager');
const JsonRpc = require('./jsonrpc');

class DexCore {
  constructor() {
    this.pluginManager = new PluginManager();
    this.jsonRpc = new JsonRpc();
    this.running = false;
  }

  async start() {
    console.log('[Core] DEX AI 核心引擎启动...');
    this.running = true;

    // 加载插件
    await this.pluginManager.loadAll();
    console.log(`[Core] 已加载 ${this.pluginManager.plugins.size} 个插件`);

    return this;
  }

  async stop() {
    this.running = false;
    await this.pluginManager.stopAll();
    console.log('[Core] 核心引擎已停止');
  }
}

module.exports = DexCore;
