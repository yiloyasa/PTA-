"""PTA configuration and Windows auto-start management."""
import json
import os
import sys
import winreg

from core.offline_translator import OfflineTranslator
from core.windows_hotkey import DEFAULT_HOTKEY

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_FILE = os.path.join(PROJECT_ROOT, "config", "config.json")
AUTOSTART_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
AUTOSTART_NAME = "PTA"


class AppConfig:
    def __init__(self):
        os.makedirs(os.path.dirname(CONFIG_FILE), exist_ok=True)
        self._data = {}
        self._load()

    def _load(self):
        if not os.path.exists(CONFIG_FILE):
            return
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as file:
                data = json.load(file)
            if isinstance(data, dict):
                self._data = data
        except (OSError, json.JSONDecodeError):
            self._data = {}

    def save(self):
        with open(CONFIG_FILE, "w", encoding="utf-8") as file:
            json.dump(self._data, file, ensure_ascii=False, indent=2)

    def get_config_path(self):
        return CONFIG_FILE

    def get_baidu_app_id(self):
        return self._data.get("baidu_app_id", "").strip()

    def get_baidu_app_secret(self):
        return self._data.get("baidu_app_secret", "").strip()

    def set_baidu_credentials(self, app_id, app_secret):
        self._data["baidu_app_id"] = app_id.strip()
        self._data["baidu_app_secret"] = app_secret.strip()
        self.save()

    def get_hotkey(self):
        return DEFAULT_HOTKEY.label

    def get_offline_model_path(self):
        return os.path.join(PROJECT_ROOT, "离线翻译引擎")

    def has_offline_model(self):
        return OfflineTranslator(self.get_offline_model_path()).is_model_available()

    @staticmethod
    def _launch_command():
        if getattr(sys, "frozen", False):
            return f'"{sys.executable}"'

        python_dir = os.path.dirname(sys.executable)
        pythonw = os.path.join(python_dir, "pythonw.exe")
        launcher = pythonw if os.path.isfile(pythonw) else sys.executable
        main_py = os.path.join(PROJECT_ROOT, "main.py")
        return f'"{launcher}" "{main_py}"'

    @staticmethod
    def is_autostart_enabled():
        try:
            with winreg.OpenKey(
                winreg.HKEY_CURRENT_USER, AUTOSTART_KEY, 0, winreg.KEY_READ
            ) as key:
                value, _ = winreg.QueryValueEx(key, AUTOSTART_NAME)
            return value == AppConfig._launch_command()
        except FileNotFoundError:
            return False

    @staticmethod
    def set_autostart(enable):
        try:
            with winreg.OpenKey(
                winreg.HKEY_CURRENT_USER, AUTOSTART_KEY, 0, winreg.KEY_SET_VALUE
            ) as key:
                if enable:
                    winreg.SetValueEx(
                        key,
                        AUTOSTART_NAME,
                        0,
                        winreg.REG_SZ,
                        AppConfig._launch_command(),
                    )
                else:
                    try:
                        winreg.DeleteValue(key, AUTOSTART_NAME)
                    except FileNotFoundError:
                        pass
            return True
        except OSError:
            return False
