// ============================================================
// 认证管理器 - JWT Token 签发与验证
// ============================================================

const crypto = require('crypto');

class AuthManager {
  constructor() {
    this.secretKey = crypto.randomBytes(32).toString('hex');
    this.tokens = new Map();
  }

  // 生成设备密钥对 (Ed25519)
  generateKeyPair() {
    return crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
  }

  // 验证 JWT Token
  verifyToken(token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, this.secretKey);
      return decoded;
    } catch (err) {
      return null;
    }
  }

  // 生成 JWT Token
  generateToken(payload) {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, this.secretKey, { expiresIn: '24h' });
  }
}

module.exports = { AuthManager };
