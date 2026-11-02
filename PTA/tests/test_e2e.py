"""End-to-end PTA hotkey translation test."""
import ctypes
import os
import time

from _bootstrap import PROJECT_ROOT

from PyQt5.QtCore import QTimer
from PyQt5.QtWidgets import QApplication, QTextEdit

from config.app_config import AppConfig
from core.windows_hotkey import HOTKEY_ID, WM_HOTKEY
from ui.main_window import MainController

SOURCE_TEXT = "她说话的小毛病"
ORIGINAL_CLIPBOARD = "PTA_ORIGINAL_CLIPBOARD"


def main():
    app = QApplication([])
    app.setQuitOnLastWindowClosed(False)

    editor = QTextEdit()
    editor.setPlainText(SOURCE_TEXT)
    editor.show()
    editor.raise_()
    editor.activateWindow()
    editor.setFocus()
    editor.selectAll()
    QApplication.clipboard().setText(ORIGINAL_CLIPBOARD)

    icon_path = os.path.join(PROJECT_ROOT, "assets", "tray_icon_001.jpg")
    controller = MainController(AppConfig(), icon_path)
    controller.hotkey.activated.connect(lambda: print("DEBUG_HOTKEY_ACTIVATED"))

    result = {"passed": False, "message": "timeout"}
    deadline = time.monotonic() + 15

    def trigger_hotkey():
        ctypes.windll.user32.PostMessageW(
            controller.hotkey.hwnd, WM_HOTKEY, HOTKEY_ID, 0
        )
        QTimer.singleShot(100, poll_result)

    def poll_result():
        if controller._last_translation:
            restored = QApplication.clipboard().text() == ORIGINAL_CLIPBOARD
            result["passed"] = restored
            result["message"] = controller._last_translation
            app.quit()
            return
        if time.monotonic() >= deadline:
            app.quit()
            return
        QTimer.singleShot(100, poll_result)

    QTimer.singleShot(500, trigger_hotkey)
    QTimer.singleShot(16000, app.quit)
    app.exec_()

    controller.hotkey.unregister()
    editor.close()
    if not result["passed"]:
        print(f"E2E_FAILED: {result['message']}")
        print(f"capture_active={controller._capture_active}")
        print(f"clipboard={QApplication.clipboard().text()!r}")
        print(f"workers={len(controller._workers)}")
        print(f"latest={controller._latest_request}")
        return 1
    print(f"E2E_OK: {result['message']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


