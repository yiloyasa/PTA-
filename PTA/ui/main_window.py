"""PTA application controller: tray, hotkey, clipboard capture, and translation."""
import logging
import time

from PyQt5.QtCore import QObject, QMimeData, QThread, QTimer, pyqtSignal
from PyQt5.QtGui import QCursor, QIcon
from PyQt5.QtWidgets import QAction, QApplication, QMenu, QSystemTrayIcon

from core.rate_limiter import TranslationRateLimiter
from core.translation_engine import TranslationEngine
from core.windows_hotkey import (
    DEFAULT_HOTKEY,
    GlobalHotkey,
    get_foreground_window,
    restore_foreground_window,
    send_ctrl_c,
    send_ctrl_insert,
)
from ui.config_dialog import show_config_dialog
from ui.floating_window import FloatingWindow
from ui.manual_window import ManualTranslateWindow


class TranslationThread(QThread):
    succeeded = pyqtSignal(str, int, str, str)
    failed = pyqtSignal(str, int, str)

    def __init__(self, engine, text, target, request_id):
        super().__init__()
        self.engine = engine
        self.text = text
        self.target = target
        self.request_id = request_id

    def run(self):
        try:
            result, source_language = self.engine.translate(self.text)
            self.succeeded.emit(
                self.target, self.request_id, result, source_language
            )
        except Exception as error:
            self.failed.emit(self.target, self.request_id, str(error))


class MainController(QObject):
    CAPTURE_TIMEOUT_SECONDS = 1.5
    COPY_RETRY_INSERT_AT = 0.35  # seconds: try Ctrl+Insert (terminals, etc.)
    COPY_RETRY_CTRL_C_AT = 0.75  # seconds: retry Ctrl+C (missed first input)

    def __init__(self, config, icon_path):
        super().__init__()
        self.config = config
        self.engine = TranslationEngine(config)
        self.rate_limiter = TranslationRateLimiter()
        self.float_window = FloatingWindow()
        self.manual_window = ManualTranslateWindow()
        self.manual_window.translate_requested.connect(self._translate_manual)

        self._icon = QIcon(icon_path)
        self._workers = set()
        self._request_sequence = 0
        self._latest_request = {"float": 0, "manual": 0}
        self._last_translation = ""
        self._capture_active = False
        self._capture_started = 0.0
        self._capture_deadline = 0.0
        self._copy_stage = 0
        self._saved_clipboard = None
        self._selection_window = 0

        self._setup_tray()
        self._setup_hotkey()
        QTimer.singleShot(500, self._announce_ready)

    def _setup_tray(self):
        self.tray = QSystemTrayIcon(self._icon, self)
        self.tray.setToolTip(
            f"PTA 悬浮翻译器\n{DEFAULT_HOTKEY.label}"
        )

        menu = QMenu()
        menu.addAction("手动翻译", self.show_manual_window)
        menu.addAction("显示最近译文", self.show_last_translation)
        menu.addSeparator()

        self.hotkey_action = QAction("启用全局快捷键", menu, checkable=True)
        self.hotkey_action.setChecked(True)
        self.hotkey_action.toggled.connect(self._toggle_hotkey)
        menu.addAction(self.hotkey_action)

        self.autostart_action = QAction("开机自启动", menu, checkable=True)
        self.autostart_action.setChecked(self.config.is_autostart_enabled())
        self.autostart_action.toggled.connect(self._toggle_autostart)
        menu.addAction(self.autostart_action)

        menu.addAction("设置", self.show_settings)
        menu.addSeparator()
        menu.addAction("退出 PTA", self.quit)

        self.tray.setContextMenu(menu)
        self.tray.activated.connect(self._tray_activated)
        self.tray.show()

    def _setup_hotkey(self):
        self.hotkey = GlobalHotkey(DEFAULT_HOTKEY)
        self.hotkey.activated.connect(self._on_hotkey)
        if not self.hotkey.register():
            self.hotkey_action.blockSignals(True)
            self.hotkey_action.setChecked(False)
            self.hotkey_action.blockSignals(False)
            QTimer.singleShot(
                600,
                lambda: self.tray.showMessage(
                    "PTA 快捷键不可用",
                    f"{DEFAULT_HOTKEY.label} 已被其他程序占用，请使用托盘中的手动翻译。",
                    QSystemTrayIcon.Warning,
                    5000,
                ),
            )

    def _announce_ready(self):
        self._show_float_text("PTA 已就绪")

    def _toggle_hotkey(self, enabled):
        if not enabled:
            self.hotkey.unregister()
            return
        if self.hotkey.register():
            return
        self.hotkey_action.blockSignals(True)
        self.hotkey_action.setChecked(False)
        self.hotkey_action.blockSignals(False)
        self.tray.showMessage(
            "PTA",
            f"无法注册 {DEFAULT_HOTKEY.label}，该组合可能已被占用。",
            QSystemTrayIcon.Warning,
            4000,
        )

    def _toggle_autostart(self, enabled):
        if self.config.set_autostart(enabled):
            return
        self.autostart_action.blockSignals(True)
        self.autostart_action.setChecked(not enabled)
        self.autostart_action.blockSignals(False)
        self.tray.showMessage(
            "PTA",
            "开机自启动设置失败。",
            QSystemTrayIcon.Warning,
            3000,
        )

    def _on_hotkey(self):
        if self._capture_active:
            return
        self._capture_active = True
        self._selection_window = get_foreground_window()
        self._show_float_text("正在读取选中文本…", auto_hide_ms=0)
        QTimer.singleShot(100, self._begin_capture)

    def _begin_capture(self):
        try:
            clipboard = QApplication.clipboard()
            self._saved_clipboard = self._clone_mime_data(clipboard.mimeData())
            clipboard.clear()
            restore_foreground_window(self._selection_window)
            self._capture_started = time.monotonic()
            self._capture_deadline = (
                self._capture_started + self.CAPTURE_TIMEOUT_SECONDS
            )
            self._copy_stage = 0
            send_ctrl_c()
            QTimer.singleShot(60, self._poll_clipboard)
        except Exception as error:
            logging.exception("读取选中文本失败")
            self._restore_clipboard()
            self._capture_active = False
            self._show_float_text(str(error), error=True)

    def _poll_clipboard(self):
        text = QApplication.clipboard().text().strip()
        if text:
            self._restore_clipboard()
            self._capture_active = False
            self._translate_selected_text(text)
            return

        elapsed = time.monotonic() - self._capture_started

        # Some apps miss the first synthetic copy or need another key:
        # retry with Ctrl+Insert, then Ctrl+C again, until the deadline.
        if self._copy_stage < 1 and elapsed >= self.COPY_RETRY_INSERT_AT:
            self._copy_stage = 1
            send_ctrl_insert()
        elif self._copy_stage < 2 and elapsed >= self.COPY_RETRY_CTRL_C_AT:
            self._copy_stage = 2
            send_ctrl_c()

        if time.monotonic() < self._capture_deadline:
            QTimer.singleShot(60, self._poll_clipboard)
            return

        self._restore_clipboard()
        self._capture_active = False
        self._show_float_text("未检测到选中文本", error=True)

    def _translate_selected_text(self, text):
        allowed, _, wait_message = self.rate_limiter.get_status(text)
        if not allowed:
            self._show_float_text(wait_message)
            return
        self.rate_limiter.record(text)
        self._start_translation(text, "float")

    def _translate_manual(self, text):
        self._start_translation(text, "manual")

    def _start_translation(self, text, target):
        self._request_sequence += 1
        request_id = self._request_sequence
        self._latest_request[target] = request_id

        if target == "float":
            self._show_float_text("翻译中…", auto_hide_ms=0)
        else:
            self.manual_window.show_loading()

        worker = TranslationThread(self.engine, text, target, request_id)
        worker.succeeded.connect(self._translation_succeeded)
        worker.failed.connect(self._translation_failed)
        worker.finished.connect(lambda worker=worker: self._release_worker(worker))
        self._workers.add(worker)
        worker.start()

    def _translation_succeeded(self, target, request_id, result, source_language):
        if request_id != self._latest_request[target]:
            return
        self._last_translation = result
        if target == "float":
            self._show_float_text(result)
        else:
            self.manual_window.show_result(result)

    def _translation_failed(self, target, request_id, message):
        if request_id != self._latest_request[target]:
            return
        logging.error("翻译失败: %s", message)
        if target == "float":
            self._show_float_text(message, error=True)
        else:
            self.manual_window.show_error(message)

    def _release_worker(self, worker):
        self._workers.discard(worker)
        worker.deleteLater()

    def _show_float_text(self, text, auto_hide_ms=10000, error=False):
        self.float_window.show_text(text, auto_hide_ms, error)
        cursor = QCursor.pos()
        screen = QApplication.screenAt(cursor) or QApplication.primaryScreen()
        area = screen.availableGeometry()
        size = self.float_window.sizeHint()

        # Default: show ABOVE the cursor so it doesn't block the original text
        x = cursor.x() + 16
        y = cursor.y() - size.height() - 12
        if x + size.width() > area.right():
            x = cursor.x() - size.width() - 16
        if y < area.top():
            # Not enough room above — show below instead
            y = cursor.y() + 24

        x = max(area.left(), min(x, area.right() - size.width() + 1))
        y = max(area.top(), min(y, area.bottom() - size.height() + 1))
        self.float_window.move(x, y)

    def show_last_translation(self):
        self._show_float_text(self._last_translation or "暂无译文")

    def show_manual_window(self):
        self.manual_window.show_and_focus()

    def show_settings(self):
        show_config_dialog(self.config)
        self.autostart_action.blockSignals(True)
        self.autostart_action.setChecked(self.config.is_autostart_enabled())
        self.autostart_action.blockSignals(False)

    def _tray_activated(self, reason):
        if reason == QSystemTrayIcon.DoubleClick:
            self.show_manual_window()

    @staticmethod
    def _clone_mime_data(source):
        clone = QMimeData()
        if source is None:
            return clone
        for mime_format in source.formats():
            clone.setData(mime_format, source.data(mime_format))
        return clone

    def _restore_clipboard(self):
        clipboard = QApplication.clipboard()
        if self._saved_clipboard is None:
            clipboard.clear()
        else:
            clipboard.setMimeData(self._saved_clipboard)
        self._saved_clipboard = None

    def quit(self):
        self.hotkey.unregister()
        self.tray.hide()
        QApplication.quit()
