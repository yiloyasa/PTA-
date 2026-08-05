# DEX AI 复刻版 - 完整逆向分析与复刻项目

> 基于 DEX AI 4.0.26 的完整逆向分析 + 功能复刻实现

## 项目架构

```
┌─────────────────────────────────────────────────────┐
│                  Web管理界面 (7446)                   │
│              Express + HTML/CSS/JS                    │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP Proxy
          ┌────────┴────────┐
          ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│  Companion服务   │  │  控制平面        │
│  :7443 (HTTPS)  │  │  :7445 (HTTP)   │
│  JSON-RPC 2.0   │  │  JWT认证/设备管理 │
│  WebSocket      │  │  LLM代理         │
└────────┬────────┘  └────────┬────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│  Android App    │  │  Web 浏览器     │
│  (Kotlin/Compose)│  │  (PWA)         │
│  JSON-RPC客户端  │  │                 │
└─────────────────┘  └─────────────────┘
```

## 模块说明

### 1. dex-companion (Companion 服务)
- **端口**: 7443 (HTTPS, 自签名证书)
- **协议**: JSON-RPC 2.0 over HTTPS + WebSocket
- **功能**:
  - 126个RPC方法（线程/文件/命令/设备/插件等）
  - 设备配对（配对码生成）
  - 文件系统操作（浏览/读写）
  - 命令执行
  - mDNS局域网发现
  - WebSocket实时通信

### 2. dex-control (控制平面)
- **端口**: 7445 (HTTP)
- **功能**:
  - 用户注册/登录/登出 (JWT认证)
  - 设备管理（注册/列表/撤销）
  - LLM代理（OpenAI API调用，带超时保护）
  - 健康检查

### 3. dex-web (Web管理界面)
- **端口**: 7446 (HTTP)
- **功能**:
  - 仪表盘（服务状态监控）
  - AI对话（LLM聊天）
  - 设备配对（生成配对码）
  - 文件浏览/编辑
  - 终端命令执行
  - RPC调试
  - 设置管理

### 4. dex-mobile (Android App)
- **技术栈**: Kotlin + Jetpack Compose
- **功能**:
  - 连接Companion服务（HTTPS JSON-RPC）
  - 设备配对
  - 文件浏览
  - 终端命令
  - WebSocket实时通信
  - mDNS局域网发现

## 快速启动

### 1. 启动Companion服务
```bash
cd dex-companion
npm install
node src/index.js
```

### 2. 启动控制平面
```bash
cd dex-control
npm install
node src/index.js
```

### 3. 启动Web管理界面
```bash
cd dex-web
npm install
node src/index.js
```

### 4. 访问Web界面
打开浏览器访问: http://127.0.0.1:7446

### 5. Android App
用 Android Studio 打开 `dex-mobile` 目录，修改 `CompanionClient.kt` 中的 `baseUrl` 为电脑IP，编译运行。

## 环境要求

- Node.js 18+
- Android Studio + JDK 17+ (Android App)
- 电脑和手机在同一局域网

## 逆向分析文档

完整的逆向分析报告位于 `DEX-AI-全面逆向复刻分析/` 目录：
- 逆向分析报告-v1.md - 主程序逆向分析
- v2-MobileCodex插件与安卓端分析/ - 插件与APK分析
- v3-主程序深度分析与网络验证/ - 网络协议分析
- v4-Android反编译与网络抓包验证/ - APK反编译
- v5-Companion服务复刻开发/ - 复刻开发文档
- v6-三服务联调完成/ - 联调文档

## 逆向分析成果

### 通信协议
| 协议 | 用途 | 端口 |
|------|------|------|
| JSON-RPC 2.0 | 主协议（请求/响应） | 7443 |
| WebSocket | 实时通信（推送/流式） | 7443/ws |
| REST API | 认证/设备管理 | 7445 |
| mDNS | 局域网设备发现 | 5353 |

### 安全机制
- TLS 1.3 传输加密（自签名证书）
- JWT Bearer Token 认证
- Ed25519 设备身份签名
- 配对码一次性验证

### 126个RPC方法
覆盖：线程管理、文件系统、命令执行、设备控制、远程控制、插件管理、环境信息、AI对话等

## Git提交历史

- v1 - 初始提交：完整逆向分析与复刻版代码
- v2 - Android App项目创建 + Web管理界面修复
