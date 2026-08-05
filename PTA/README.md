# PTA - 悬浮翻译器

PTA 是一个 Windows 桌面翻译工具：选中文本后按全局快捷键，译文会在鼠标右下方的圆角悬浮窗中显示；也可以从系统托盘打开手动翻译窗口。

## 已实现功能

- 选中文本后按 **Ctrl + Alt + Shift + F9** 自动翻译
- 不修改系统已有快捷键，热键由 PTA 独立注册
- 自动判断中文/英文并选择中译英或英译中
- 悬浮窗只显示译文，支持拖动，自动避开屏幕边界
- 托盘管理：手动翻译、最近译文、快捷键开关、设置、开机自启、退出
- 手动翻译窗口：粘贴文本后点击“翻译”，或按 Ctrl + Enter
- 同一段文本自动触发翻译 3 次后冷却 10 秒，冷却提示为 `......`
- 百度翻译 API 在线引擎
- NLLB-200 Distilled 600M 离线引擎接口，模型文件放在 `离线翻译引擎` 子文件夹
- 桌面快捷方式和 `start.vbs` 均使用 `pythonw.exe`，不依赖终端窗口
- 单实例运行，重复启动只唤起已有 PTA

## 启动方式

### 桌面入口
双击桌面上的 **PTA 悬浮翻译器** 快捷方式。

### 项目入口
双击：

```text
G:\项目two\PTA\start.vbs
```

它会隐藏终端并在系统托盘中运行 PTA。

### 命令行调试
如需查看启动日志，可以使用：

```text
python main.py
```

正常使用不需要打开终端。

## 百度翻译配置

首次启动会打开配置窗口，也可以从托盘右键进入“设置”。百度 API 的 App ID 和 App Secret 必须同时填写。

申请入口：<https://fanyi-api.baidu.com/>

## 离线引擎

离线模型目录：

```text
G:\项目two\PTA\离线翻译引擎
```

安装离线依赖：

```text
python -m pip install -r requirements-offline.txt
```

下载 NLLB 模型到 PTA 子文件夹：

```text
python install_offline_engine.py
```

模型较大，下载完成后，百度 API 不可用时 PTA 会自动尝试离线翻译。
