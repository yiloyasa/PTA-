"""Windows hotkey integration test for PTA."""
import ctypes

from _bootstrap import PROJECT_ROOT  # noqa: F401

from PyQt5.QtCore import QTimer
from PyQt5.QtWidgets import QApplication

from core.windows_hotkey import GlobalHotkey, HOTKEY_ID, WM_HOTKEY


def main():
    app = QApplication([])
    hotkey = GlobalHotkey()
    if not hotkey.register():
        print("HOTKEY_REGISTER_FAILED")
        return 1

    state = {"triggered": False}

    def on_activated():
        state["triggered"] = True
        app.quit()

    hotkey.activated.connect(on_activated)
    QTimer.singleShot(
        100,
        lambda: ctypes.windll.user32.PostMessageW(
            hotkey.hwnd, WM_HOTKEY, HOTKEY_ID, 0
        ),
    )
    QTimer.singleShot(1500, app.quit)
    app.exec_()
    hotkey.unregister()

    if not state["triggered"]:
        print("HOTKEY_MESSAGE_FAILED")
        return 1
    print("HOTKEY_INTEGRATION_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
