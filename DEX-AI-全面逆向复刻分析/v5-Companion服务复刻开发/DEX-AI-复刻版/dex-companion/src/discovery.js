// ============================================================
// 设备发现服务 - mDNS (兼容原版 CompanionDiscovery)
// ============================================================

const crypto = require('crypto');

class DiscoveryService {
  constructor() {
    this.mdns = null;
    this.running = false;
  }

  start(config) {
    this.running = true;
    console.log('[Discovery] mDNS 发现服务已启动');
    console.log(`[Discovery] 设备ID: ${config.device_id}`);
    console.log(`[Discovery] 服务类型: _mobilecodex._tcp.local`);

    // 使用 multicast-dns 库
    try {
      const mdns = require('multicast-dns')();
      
      // 响应查询
      mdns.on('query', (query) => {
        if (!this.running) return;
        
        const questions = query.questions || [];
        for (const q of questions) {
          if (q.name === '_mobilecodex._tcp.local' || q.name === config.device_id + '._mobilecodex._tcp.local') {
            mdns.respond({
              answers: [{
                name: '_mobilecodex._tcp.local',
                type: 'PTR',
                data: config.device_id + '._mobilecodex._tcp.local',
              }, {
                name: config.device_id + '._mobilecodex._tcp.local',
                type: 'SRV',
                data: {
                  priority: 10,
                  weight: 5,
                  port: parseInt(config.listen_addr.split(':')[1] || '7443'),
                  target: require('os').hostname(),
                },
              }, {
                name: config.device_id + '._mobilecodex._tcp.local',
                type: 'TXT',
                data: [Buffer.from('device_id=' + config.device_id)],
              }],
            });
            console.log('[Discovery] 响应设备发现查询');
          }
        }
      });

      this.mdns = mdns;
      console.log('[Discovery] mDNS 响应就绪');
    } catch (err) {
      console.warn('[Discovery] mDNS 不可用:', err.message);
    }
  }

  stop() {
    this.running = false;
    if (this.mdns) {
      this.mdns.destroy();
      this.mdns = null;
    }
    console.log('[Discovery] 已停止');
  }
}

module.exports = { DiscoveryService };
