"""Manual paste translation window."""
from PyQt5.QtCore import Qt, pyqtSignal
from PyQt5.QtGui import QKeySequence, QTextCursor
from PyQt5.QtWidgets import (
    QApplication,
    QLabel,
    QPushButton,
    QShortcut,
    QTextEdit,
    QVBoxLayout,
    QHBoxLayout,
    QWidget,
)


class ManualTranslateWindow(QWidget):
    translate_requested = pyqtSignal(str)

    def __init__(self):
        super().__init__()
        self.setWindowTitle("PTA 手动翻译")
        self.resize(650, 500)
        self.setMinimumSize(520, 400)
        self.setStyleSheet(
            """
            QWidget {
                background: #F6F7FB;
                color: #172033;
                font-family: "Microsoft YaHei UI";
            }
            QLabel#title { font-size: 24px; font-weight: 700; }
            QLabel#hint { font-size: 13px; color: #667085; }
            QTextEdit {
                background: white;
                border: 1px solid #DDE2EA;
                border-radius: 12px;
                padding: 13px;
                font-size: 17px;
                selection-background-color: #B9D7FF;
            }
            QPushButton {
                min-height: 38px;
                padding: 0 18px;
                border-radius: 12px;
                border: 1px solid #D0D5DD;
                background: white;
                font-size: 14px;
            }
            QPushButton:hover { background: #F2F4F7; }
            QPushButton#primary {
                min-width: 112px;
                color: white;
                background: #1769E0;
                border: 1px solid #1769E0;
                font-weight: 600;
            }
            QPushButton#primary:hover { background: #0F5CCB; }
            """
        )

        layout = QVBoxLayout(self)
        layout.setContentsMargins(24, 22, 24, 24)
        layout.setSpacing(12)

        title = QLabel("手动翻译")
        title.setObjectName("title")
        layout.addWidget(title)

        hint = QLabel("粘贴中文或英文，PTA 会自动判断翻译方向。Ctrl + Enter 可直接翻译。")
        hint.setObjectName("hint")
        hint.setWordWrap(True)
        layout.addWidget(hint)

        self.input_edit = QTextEdit()
        self.input_edit.setPlaceholderText("在这里粘贴需要翻译的文本……")
        layout.addWidget(self.input_edit, 1)

        actions = QHBoxLayout()
        self.paste_button = QPushButton("粘贴")
        self.paste_button.clicked.connect(self.paste_clipboard)
        actions.addWidget(self.paste_button)

        actions.addStretch()
        self.translate_button = QPushButton("翻译")
        self.translate_button.setObjectName("primary")
        self.translate_button.clicked.connect(self.request_translation)
        actions.addWidget(self.translate_button)
        layout.addLayout(actions)

        result_title = QLabel("译文")
        result_title.setStyleSheet("font-size: 15px; font-weight: 700; margin-top: 5px;")
        layout.addWidget(result_title)

        self.result_edit = QTextEdit()
        self.result_edit.setReadOnly(True)
        self.result_edit.setPlaceholderText("译文会显示在这里")
        result_font = self.result_edit.font()
        result_font.setPointSize(14)
        self.result_edit.setFont(result_font)
        layout.addWidget(self.result_edit, 1)

        QShortcut(QKeySequence("Ctrl+Return"), self).activated.connect(
            self.request_translation
        )

    def paste_clipboard(self):
        text = QApplication.clipboard().text()
        if text:
            self.input_edit.setPlainText(text)
            self.input_edit.moveCursor(QTextCursor.End)

    def request_translation(self):
        text = self.input_edit.toPlainText().strip()
        if not text:
            self.result_edit.setPlainText("请先粘贴或输入文本。")
            return
        self.translate_requested.emit(text)

    def show_loading(self):
        self._set_busy(True)
        self.result_edit.setPlainText("翻译中…")

    def show_result(self, result):
        self._set_busy(False)
        self.result_edit.setPlainText(result)

    def show_error(self, message):
        self._set_busy(False)
        self.result_edit.setPlainText("错误：" + message)

    def _set_busy(self, busy):
        self.translate_button.setEnabled(not busy)
        self.translate_button.setText("翻译中…" if busy else "翻译")

    def show_and_focus(self):
        self.show()
        self.raise_()
        self.activateWindow()
        self.input_edit.setFocus()



