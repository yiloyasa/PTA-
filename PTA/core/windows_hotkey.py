"""Windows global hotkey and keyboard helpers for PTA."""
import ctypes
import logging
from ctypes import wintypes
from dataclasses import dataclass

from PyQt5.QtCore import Qt, pyqtSignal
from PyQt5.QtWidgets import QWidget

WM_HOTKEY = 0x0312
HOTKEY_ID = 0x5054

MOD_ALT = 0x0001
MOD_CONTROL = 0x0002
MOD_SHIFT = 0x0004
MOD_NOREPEAT = 0x4000

VK_CONTROL = 0x11
VK_SHIFT = 0x10
VK_MENU = 0x12
VK_LWIN = 0x5B
VK_RWIN = 0x5C
VK_C = 0x43
VK_F9 = 0x78
VK_INSERT = 0x2D
KEYEVENTF_KEYUP = 0x0002


@dataclass(frozen=True)
class HotkeySpec:
    modifiers: int
    virtual_key: int
    label: str


DEFAULT_HOTKEY = HotkeySpec(
    MOD_CONTROL | MOD_ALT | MOD_SHIFT | MOD_NOREPEAT,
    VK_F9,
    "Ctrl + Alt + Shift + F9",
)


class GlobalHotkey(QWidget):
    """Hidden native window that receives WM_HOTKEY reliably."""

    activated = pyqtSignal()

    def __init__(self, spec=DEFAULT_HOTKEY):
        super().__init__(None)
        self.spec = spec
        self._registered = False
        self.setAttribute(Qt.WA_NativeWindow, True)
        self.hide()
        self._hwnd = int(self.winId())

    @property
    def hwnd(self):
        return self._hwnd

    @property
    def is_registered(self):
        return self._registered

    def register(self):
        self.unregister()
        result = ctypes.windll.user32.RegisterHotKey(
            self._hwnd,
            HOTKEY_ID,
            self.spec.modifiers,
            self.spec.virtual_key,
        )
        self._registered = bool(result)
        if not self._registered:
            logging.error("全局热键注册失败: %s", self.spec.label)
        return self._registered

    def unregister(self):
        if self._hwnd:
            ctypes.windll.user32.UnregisterHotKey(self._hwnd, HOTKEY_ID)
        self._registered = False

    def nativeEvent(self, event_type, message):
        try:
            msg = wintypes.MSG.from_address(int(message))
            if msg.message == WM_HOTKEY and msg.wParam == HOTKEY_ID:
                self.activated.emit()
                return True, 0
        except (TypeError, ValueError, OSError):
            logging.exception("处理全局热键消息失败")
        return False, 0

    def closeEvent(self, event):
        self.unregister()
        super().closeEvent(event)


def get_foreground_window():
    return ctypes.windll.user32.GetForegroundWindow()


def restore_foreground_window(hwnd):
    if hwnd:
        ctypes.windll.user32.SetForegroundWindow(hwnd)


def _release_modifier_keys():
    user32 = ctypes.windll.user32
    for key in (VK_SHIFT, VK_CONTROL, VK_MENU, VK_LWIN, VK_RWIN):
        user32.keybd_event(key, 0, KEYEVENTF_KEYUP, 0)


def _press_combo(*virtual_keys):
    user32 = ctypes.windll.user32
    for key in virtual_keys:
        user32.keybd_event(key, 0, 0, 0)
    for key in reversed(virtual_keys):
        user32.keybd_event(key, 0, KEYEVENTF_KEYUP, 0)


def send_ctrl_c():
    """Release hotkey modifiers, then synthesize Ctrl+C."""
    _release_modifier_keys()
    _press_combo(VK_CONTROL, VK_C)


def send_ctrl_insert():
    """Ctrl+Insert copy fallback — works in terminals and some other apps."""
    _release_modifier_keys()
    _press_combo(VK_CONTROL, VK_INSERT)
