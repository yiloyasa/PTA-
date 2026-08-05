// ============================================================
// 插件管理器
// 加载/卸载/管理插件进程
// ============================================================

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.pluginDir = path.join(__dirname, '..', '..', 'plugins');
  }

  async loadAll() {
    if (!fs.existsSync(this.pluginDir)) {
      console.log('[Plugin] 插件目录不存在');
      return;
    }

    const entries = fs.readdirSync(this.pluginDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const jsonPath = path.join(this.pluginDir, entry.name, 'plugin.json');
        if (fs.existsSync(jsonPath)) {
          await this.loadPlugin(entry.name, jsonPath);
        }
      }
    }
  }

  async loadPlugin(name, jsonPath) {
    try {
      const config = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      console.log(`[Plugin] 加载: ${config.name || name}`);

      const plugin = {
        config,
        name,
        process: null,
        rpc: null,
        status: 'loaded',
      };

      this.plugins.set(name, plugin);
      return plugin;
    } catch (err) {
      console.error(`[Plugin] 加载失败 ${name}:`, err.message);
    }
  }

  async startPlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`插件不存在: ${name}`);

    const entry = plugin.config.entry;
    if (!entry) throw new Error(`插件 ${name} 缺少入口配置`);

    const scriptPath = path.join(this.pluginDir, name, entry.script);
    if (!fs.existsSync(scriptPath)) throw new Error(`入口文件不存在: ${scriptPath}`);

    console.log(`[Plugin] 启动: ${name} (${entry.runtime})`);

    switch (entry.runtime) {
      case 'node':
        plugin.process = spawn('node', [scriptPath, ...(entry.args || [])]);
        break;
      case 'python':
        plugin.process = spawn('python', [scriptPath, ...(entry.args || [])]);
        break;
      case 'binary':
        plugin.process = spawn(scriptPath, entry.args || []);
        break;
      default:
        throw new Error(`不支持的运行时: ${entry.runtime}`);
    }

    plugin.status = 'running';

    plugin.process.stdout.on('data', (data) => {
      console.log(`[Plugin:${name}] ${data.toString().trim()}`);
    });

    plugin.process.stderr.on('data', (data) => {
      console.error(`[Plugin:${name}] ${data.toString().trim()}`);
    });

    plugin.process.on('exit', (code) => {
      console.log(`[Plugin] ${name} 已退出 (code: ${code})`);
      plugin.status = 'stopped';
    });
  }

  async stopPlugin(name) {
    const plugin = this.plugins.get(name);
    if (plugin && plugin.process) {
      plugin.process.kill();
      plugin.status = 'stopped';
      console.log(`[Plugin] 已停止: ${name}`);
    }
  }

  async stopAll() {
    for (const [name] of this.plugins) {
      await this.stopPlugin(name);
    }
  }
}

module.exports = PluginManager;
