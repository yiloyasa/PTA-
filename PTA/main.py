"""PTA entry point."""
import logging
import os
import sys
from logging.handlers import RotatingFileHandler

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
LIBS_DIR = os.path.join(PROJECT_ROOT, "libs")
sys.path.insert(0, PROJECT_ROOT)
if os.path.isdir(LIBS_DIR):
    sys.path.insert(0, LIBS_DIR)

from PyQt5.QtCore import QObject, Qt, pyqtSignal
from PyQt5.QtGui import QIcon
from PyQt5.QtNetwork import QLocalServer, QLocalSocket
from PyQt5.QtWidgets import QApplication

from config.app_config import AppConfig
from ui.config_dialog import show_config_dialog
from ui.main_window import MainController

APP_SERVER_NAME = "PTA-Floating-Translator-v2"


class SingleInstance(QObject):
    message_received = pyqtSignal(str)

    def __init__(self, server_name):
        super().__init__()
        self.server_name = server_name
        self.server = None
        self.is_primary = self._claim_instance()

    def _claim_instance(self):
        socket = QLocalSocket()
        socket.connectToServer(self.server_name)
        if socket.waitForConnected(200):
            socket.write(b"show-manual")
            socket.waitForBytesWritten(200)
            socket.disconnectFromServer()
            return False

        QLocalServer.removeServer(self.server_name)
        self.server = QLocalServer(self)
        self.server.newConnection.connect(self._read_messages)
        return self.server.listen(self.server_name)

    def _read_messages(self):
        while self.server.hasPendingConnections():
            socket = self.server.nextPendingConnection()
            if socket.waitForReadyRead(100):
                message = bytes(socket.readAll()).decode("utf-8", errors="replace")
                self.message_received.emit(message)
            socket.disconnectFromServer()
            socket.deleteLater()


def configure_logging():
    log_dir = os.path.join(PROJECT_ROOT, "logs")
    os.makedirs(log_dir, exist_ok=True)
    handler = RotatingFileHandler(
        os.path.join(log_dir, "pta.log"),
        maxBytes=512 * 1024,
        backupCount=2,
        encoding="utf-8",
    )
    handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    logging.basicConfig(level=logging.INFO, handlers=[handler], force=True)


def main():
    configure_logging()
    QApplication.setAttribute(Qt.AA_EnableHighDpiScaling, True)
    QApplication.setAttribute(Qt.AA_UseHighDpiPixmaps, True)

    app = QApplication(sys.argv)
    app.setApplicationName("PTA")
    app.setOrganizationName("PTA")
    app.setQuitOnLastWindowClosed(False)
    app.setStyle("Fusion")

    icon_path = os.path.join(PROJECT_ROOT, "assets", "PTA.ico")
    if not os.path.isfile(icon_path):
        icon_path = os.path.join(PROJECT_ROOT, "assets", "tray_icon_001.jpg")
    app.setWindowIcon(QIcon(icon_path))

    instance = SingleInstance(APP_SERVER_NAME)
    if not instance.is_primary:
        return 0

    config = AppConfig()
    if not config.get_baidu_app_id() and not config.has_offline_model():
        show_config_dialog(config)

    controller = MainController(config, icon_path)
    instance.message_received.connect(
        lambda message: controller.show_manual_window()
        if message == "show-manual"
        else None
    )

    return app.exec_()


if __name__ == "__main__":
    sys.exit(main())
