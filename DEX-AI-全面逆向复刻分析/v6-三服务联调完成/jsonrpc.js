// ============================================================
// JSON-RPC 2.0 协议处理器
// 基于已获取的完整 Schema 实现
// ============================================================

const fs = require('fs');
const path = require('path');

class JsonRpcServer {
  constructor() {
    this.handlers = new Map();
    this.notifications = new Map();
    this.schemas = new Map();
  }

  loadHandlers(handlersDir) {
    // 加载协议 Schema
    const schemasDir = path.join(__dirname, '..', 'schemas');
    if (fs.existsSync(schemasDir)) {
      const files = fs.readdirSync(schemasDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(schemasDir, file), 'utf-8');
          this.schemas.set(file.replace('.json', ''), JSON.parse(content));
        } catch (err) {
          console.warn(`[Schema] 加载失败: ${file}`);
        }
      }
      console.log(`[Schema] 已加载 ${this.schemas.size} 个协议定义`);
    }

    // 加载协议处理器目录
    if (fs.existsSync(handlersDir)) {
      const files = fs.readdirSync(handlersDir).filter(f => f.endsWith('.js'));
      for (const file of files) {
        try {
          const handler = require(path.join(handlersDir, file));
          if (handler.methods) {
            for (const [method, fn] of Object.entries(handler.methods)) {
              this.register(method, fn);
            }
          }
          console.log(`[Handler] 已加载: ${file}`);
        } catch (err) {
          console.warn(`[Handler] 加载失败: ${file}: ${err.message}`);
        }
      }
    }

    // 注册内置方法
    this.registerBuiltinMethods();
  }

  registerBuiltinMethods() {
    // 初始化
    this.register('initialize', async (params) => {
      return {
        name: 'DEX AI Companion',
        version: '1.0.0',
        capabilities: ['thread', 'fs', 'command', 'channel', 'qr_login'],
      };
    });

    // 线程列表
    this.register('thread/list', async (params) => {
      return { threads: [] };
    });

    // 线程读取
    this.register('thread/read', async (params) => {
      return { thread: null };
    });

    // 模型列表
    this.register('model/list', async (params) => {
      return {
        models: [
          { id: 'gpt-4', name: 'GPT-4' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        ],
      };
    });

    // 文件系统读取
    this.register('fs/readFile', async (params) => {
      try {
        const content = fs.readFileSync(params.path, 'utf-8');
        return { content };
      } catch (err) {
        throw new Error(`无法读取文件: ${err.message}`);
      }
    });

    // 文件系统写入
    this.register('fs/writeFile', async (params) => {
      try {
        fs.writeFileSync(params.path, params.content, 'utf-8');
        return { success: true };
      } catch (err) {
        throw new Error(`无法写入文件: ${err.message}`);
      }
    });

    // 文件系统列表
    this.register('fs/readDirectory', async (params) => {
      try {
        const items = fs.readdirSync(params.path, { withFileTypes: true });
        return {
          entries: items.map(item => ({
            name: item.name,
            type: item.isDirectory() ? 'directory' : 'file',
            size: item.isFile() ? fs.statSync(path.join(params.path, item.name)).size : 0,
          })),
        };
      } catch (err) {
        throw new Error(`无法读取目录: ${err.message}`);
      }
    });
  }

  // 注册 RPC 方法
  register(method, handler) {
    this.handlers.set(method, handler);
  }

  // 注册通知处理器
  onNotification(method, handler) {
    this.notifications.set(method, handler);
  }

  // 处理请求
  async handleRequest(msg) {
    const handler = this.handlers.get(msg.method);
    if (!handler) {
      throw new Error(`Method not found: ${msg.method}`);
    }
    return await handler(msg.params || {});
  }

  // 处理通知
  async handleNotification(msg) {
    const handler = this.notifications.get(msg.method);
    if (handler) {
      await handler(msg.params || {});
    }
  }
}

module.exports = { JsonRpcServer };
