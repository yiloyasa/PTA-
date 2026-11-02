"""Manual translation integration test."""
import os
import time

from _bootstrap import PROJECT_ROOT

from PyQt5.QtCore import QTimer
from PyQt5.QtWidgets import QApplication

from config.app_config import AppConfig
from ui.main_window import MainController


def main():
    app = QApplication([])
    app.setQuitOnLastWindowClosed(False)
    icon_path = os.path.join(PROJECT_ROOT, "assets", "tray_icon_001.jpg")
    controller = MainController(AppConfig(), icon_path)
    controller._translate_manual("Hello world")
    result = {"text": ""}
    deadline = time.monotonic() + 12

    def poll():
        text = controller.manual_window.result_edit.toPlainText().strip()
        if text and text != "翻译中…":
            result["text"] = text
            app.quit()
            return
        if time.monotonic() >= deadline:
            app.quit()
            return
        QTimer.singleShot(100, poll)

    QTimer.singleShot(100, poll)
    QTimer.singleShot(13000, app.quit)
    app.exec_()
    controller.hotkey.unregister()

    if "你好" not in result["text"]:
        print(f"MANUAL_TRANSLATION_FAILED: {result['text']!r}")
        return 1
    print(f"MANUAL_TRANSLATION_OK: {result['text']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
