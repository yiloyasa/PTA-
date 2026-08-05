# DEX Mobile - Android App 使用说明

## 项目概述
基于 DEX AI 4.0.26 逆向分析的 Android 端复刻实现。
使用 Kotlin + Jetpack Compose 开发，通过 JSON-RPC 2.0 协议连接桌面端 Companion 服务。

## 技术栈
- Kotlin + Jetpack Compose (UI)
- OkHttp (网络请求)
- Gson (JSON序列化)
- Kotlin Coroutines (异步)
- Room (本地存储)

## 项目结构
```
app/src/main/java/dev/mobilecodex/
├── MainActivity.kt              # 主Activity
├── MobileCodexApplication.kt     # Application类
├── data/
│   ├── model/Models.kt          # 数据模型
│   ├── network/
│   │   ├── CompanionClient.kt   # JSON-RPC客户端
│   │   ├── WebSocketClient.kt   # WebSocket实时通信
│   │   └── ConnectionManager.kt # 连接管理 + mDNS发现
│   └── repository/
│       └── MobileCodexRepository.kt  # 数据仓库
└── ui/
    ├── theme/Theme.kt           # 暗色主题
    └── screens/
        ├── MainScreen.kt        # 主界面 + 底部导航
        ├── HomeScreen.kt        # 首页（状态/配对/快速操作）
        ├── TerminalScreen.kt    # 终端（命令执行）
        ├── FileBrowserScreen.kt # 文件浏览器
        └── SettingsScreen.kt    # 设置
```

## 配置

### 修改服务器地址
在 `CompanionClient.kt` 中修改 `baseUrl` 默认值：
```kotlin
class CompanionClient(
    private val baseUrl: String = "https://192.168.1.100:7443"
)
```

### 需要的权限
- INTERNET - 网络通信
- ACCESS_NETWORK_STATE - 网络状态检测
- ACCESS_WIFI_STATE - WiFi状态（mDNS发现）
- CHANGE_WIFI_MULTICAST_STATE - 多播（mDNS）

## 编译运行

### 方式一：Android Studio
1. 打开 `dex-mobile` 目录
2. 等待 Gradle 同步完成
3. 修改服务器地址为电脑IP
4. 连接手机或启动模拟器
5. 点击 Run

### 方式二：命令行
```bash
cd dex-mobile
./gradlew assembleDebug
# APK 生成在 app/build/outputs/apk/debug/
```

## 连接流程

1. 确保电脑端 Companion 服务已启动（:7443）
2. 手机和电脑在同一局域网
3. 打开 App，自动尝试连接
4. 或在设置中手动输入服务器地址
5. 连接成功后，点击"生成配对码"
6. 配对码有效期为300秒
7. 在桌面端 Web 界面输入配对码完成绑定

## RPC 方法列表

App 支持调用以下 RPC 方法：
- initialize - 初始化连接
- fs/readDirectory - 读取目录
- fs/readFile - 读取文件
- fs/writeFile - 写入文件
- command/exec - 执行命令
- remoteControl/pairing/start - 生成配对码
- remoteControl/status/read - 读取设备状态

更多方法可在 Web 界面的 RPC 调试页面查看。
