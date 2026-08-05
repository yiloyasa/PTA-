"""PTA settings dialog."""
import os

from PyQt5.QtCore import Qt
from PyQt5.QtWidgets import (
    QCheckBox,
    QDialog,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMessageBox,
    QPushButton,
    QVBoxLayout,
)


class ConfigDialog(QDialog):
    def __init__(self, config):
        super().__init__()
        self.config = config
        self.setWindowTitle("PTA 设置")
        self.setFixedSize(560, 500)
        self.setStyleSheet(
            """
            QDialog { background: #F7F8FC; font-family: "Microsoft YaHei UI"; }
            QLabel { color: #172033; font-size: 14px; }
            QLabel#title { font-size: 24px; font-weight: 700; color: #1769E0; }
            QLabel#hint { color: #667085; font-size: 13px; }
            QLineEdit {
                min-height: 40px; padding: 0 12px; font-size: 14px;
                background: white; border: 1px solid #D0D5DD; border-radius: 9px;
            }
            QLineEdit:focus { border: 1px solid #1769E0; }
            QCheckBox { font-size: 14px; spacing: 8px; }
            QPushButton {
                min-height: 38px; padding: 0 18px; border-radius: 9px;
                border: 1px solid #D0D5DD; background: white; font-size: 14px;
            }
            QPushButton:hover { background: #F2F4F7; }
            QPushButton#primary {
                color: white; background: #1769E0; border-color: #1769E0;
                font-weight: 600;
            }
            QPushButton#primary:hover { background: #0F5CCB; }
            """
        )
        self._build()
        self._populate()

    def _build(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(30, 26, 30, 26)
        layout.setSpacing(12)

        title = QLabel("PTA 悬浮翻译器")
        title.setObjectName("title")
        layout.addWidget(title)

        hint = QLabel(
            f"选中文本后按 {self.config.get_hotkey()}。"
            "悬浮窗只显示译文；托盘双击可打开手动翻译。"
        )
        hint.setObjectName("hint")
        hint.setWordWrap(True)
        layout.addWidget(hint)

        section = QLabel("百度翻译 API（可选）")
        section.setStyleSheet("font-weight: 700; margin-top: 10px;")
        layout.addWidget(section)

        self.app_id = QLineEdit()
        self.app_id.setPlaceholderText("App ID")
        layout.addWidget(self.app_id)

        self.app_secret = QLineEdit()
        self.app_secret.setPlaceholderText("App Secret")
        self.app_secret.setEchoMode(QLineEdit.PasswordEchoOnEdit)
        layout.addWidget(self.app_secret)

        help_label = QLabel(
            '<a href="https://fanyi-api.baidu.com/">打开百度翻译开放平台申请免费 API</a>'
        )
        help_label.setOpenExternalLinks(True)
        help_label.setTextInteractionFlags(Qt.TextBrowserInteraction)
        help_label.setStyleSheet("color: #1769E0; font-size: 13px;")
        layout.addWidget(help_label)

        offline_state = "已安装" if self.config.has_offline_model() else "未安装"
        self.offline_label = QLabel(
            f"NLLB-200 Distilled 600M 离线模型：{offline_state}\n"
            f"目录：{self.config.get_offline_model_path()}"
        )
        self.offline_label.setObjectName("hint")
        self.offline_label.setWordWrap(True)
        layout.addWidget(self.offline_label)

        open_model_dir = QPushButton("打开离线引擎文件夹")
        open_model_dir.clicked.connect(self._open_model_directory)
        layout.addWidget(open_model_dir, 0, Qt.AlignLeft)

        self.autostart = QCheckBox("开机自启动（后台运行，不显示终端）")
        layout.addWidget(self.autostart)
        layout.addStretch()

        buttons = QHBoxLayout()
        buttons.addStretch()
        cancel_button = QPushButton("取消")
        cancel_button.clicked.connect(self.reject)
        buttons.addWidget(cancel_button)

        save_button = QPushButton("保存")
        save_button.setObjectName("primary")
        save_button.clicked.connect(self.accept)
        buttons.addWidget(save_button)
        layout.addLayout(buttons)

    def _populate(self):
        self.app_id.setText(self.config.get_baidu_app_id())
        self.app_secret.setText(self.config.get_baidu_app_secret())
        self.autostart.setChecked(self.config.is_autostart_enabled())

    def _open_model_directory(self):
        path = self.config.get_offline_model_path()
        os.makedirs(path, exist_ok=True)
        os.startfile(path)

    def accept(self):
        app_id = self.app_id.text().strip()
        app_secret = self.app_secret.text().strip()
        if bool(app_id) != bool(app_secret):
            QMessageBox.warning(self, "配置不完整", "App ID 和 App Secret 必须同时填写。")
            return

        self.config.set_baidu_credentials(app_id, app_secret)
        if not self.config.set_autostart(self.autostart.isChecked()):
            QMessageBox.warning(self, "设置失败", "无法修改开机自启动设置。")
            return
        super().accept()


def show_config_dialog(config):
    return ConfigDialog(config).exec_() == QDialog.Accepted
