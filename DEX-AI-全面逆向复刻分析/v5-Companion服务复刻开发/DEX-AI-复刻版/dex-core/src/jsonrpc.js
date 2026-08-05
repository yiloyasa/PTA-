// ============================================================
// JSON-RPC 2.0 实现
// ============================================================

class JsonRpc {
  constructor() {
    this.handlers = new Map();
    this.requestId = 0;
  }

  register(method, handler) {
    this.handlers.set(method, handler);
  }

  async handleMessage(msg) {
    if (!msg || msg.jsonrpc !== '2.0') {
      return { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid Request' } };
    }

    if (msg.id === undefined) {
      // 通知
      const handler = this.handlers.get(msg.method);
      if (handler) handler(msg.params);
      return null;
    }

    // 请求
    const handler = this.handlers.get(msg.method);
    if (!handler) {
      return {
        jsonrpc: '2.0',
        id: msg.id,
        error: { code: -32601, message: `Method not found: ${msg.method}` },
      };
    }

    try {
      const result = await handler(msg.params);
      return { jsonrpc: '2.0', id: msg.id, result };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id: msg.id,
        error: { code: -32603, message: err.message },
      };
    }
  }

  createRequest(method, params) {
    return {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      params,
    };
  }

  createNotification(method, params) {
    return {
      jsonrpc: '2.0',
      method,
      params,
    };
  }
}

module.exports = JsonRpc;
