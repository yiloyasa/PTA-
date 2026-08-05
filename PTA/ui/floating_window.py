"""Floating window — shows above cursor, scrollable for long text."""
from PyQt5.QtCore import Qt, QTimer
from PyQt5.QtGui import QColor, QFont, QFontMetrics
from PyQt5.QtWidgets import (
    QFrame,
    QGraphicsDropShadowEffect,
    QLabel,
    QScrollArea,
    QVBoxLayout,
    QWidget,
)


class FloatingWindow(QWidget):
    MIN_WIDTH = 160
    MAX_WIDTH = 400
    MAX_VISIBLE_HEIGHT = 280
    HOVER_OPACITY = 0.65
    FULL_OPACITY = 1.0

    def __init__(self):
        super().__init__(None)
        self.setWindowFlags(
            Qt.Tool | Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint
        )
        self.setAttribute(Qt.WA_TranslucentBackground, True)
        self.setAttribute(Qt.WA_ShowWithoutActivating, True)
        self._drag_offset = None

        outer = QVBoxLayout(self)
        outer.setContentsMargins(8, 8, 8, 10)

        self.card = QFrame()
        self.card.setObjectName("card")
        self.card.setStyleSheet(
            """
            QFrame#card {
                background: rgba(255, 255, 255, 248);
                border: 1px solid rgba(17, 24, 39, 24);
                border-radius: 10px;
            }
            """
        )
        shadow = QGraphicsDropShadowEffect(self.card)
        shadow.setBlurRadius(18)
        shadow.setOffset(0, 4)
        shadow.setColor(QColor(0, 0, 0, 45))
        self.card.setGraphicsEffect(shadow)
        outer.addWidget(self.card)

        content = QVBoxLayout(self.card)
        content.setContentsMargins(0, 0, 0, 0)

        # Scroll area for long text
        self.scroll = QScrollArea()
        self.scroll.setWidgetResizable(True)
        self.scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        self.scroll.setVerticalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        self.scroll.setStyleSheet(
            """
            QScrollArea {
                background: transparent;
                border: none;
            }
            QScrollBar:vertical {
                width: 6px;
                background: transparent;
                margin: 2px 0;
            }
            QScrollBar::handle:vertical {
                background: rgba(0,0,0,18);
                border-radius: 3px;
                min-height: 20px;
            }
            QScrollBar::handle:vertical:hover {
                background: rgba(0,0,0,35);
            }
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
                height: 0;
            }
            """
        )
        content.addWidget(self.scroll)

        self._scroll_content = QWidget()
        self._scroll_content.setStyleSheet("background: transparent;")
        scroll_layout = QVBoxLayout(self._scroll_content)
        scroll_layout.setContentsMargins(14, 10, 14, 10)

        self.result_label = QLabel()
        self.result_label.setWordWrap(True)
        self.result_label.setAlignment(Qt.AlignLeft | Qt.AlignVCenter)
        self.result_label.setAttribute(Qt.WA_TransparentForMouseEvents, True)
        self.result_label.setStyleSheet("background: transparent; border: none;")
        font = QFont("Microsoft YaHei UI", 9)
        font.setWeight(QFont.Medium)
        self.result_label.setFont(font)
        scroll_layout.addWidget(self.result_label)

        self.scroll.setWidget(self._scroll_content)

        self._auto_hide = QTimer(self)
        self._auto_hide.setSingleShot(True)
        self._auto_hide.timeout.connect(self.hide)

    def _apply_text_style(self, error):
        color = "#B42318" if error else "#172033"
        self.result_label.setStyleSheet(
            f"""
            QLabel {{
                color: {color};
                font-family: "Microsoft YaHei UI";
                font-size: 14px;
                font-weight: 500;
                background: transparent;
                border: none;
                padding: 0px;
            }}
            """
        )

    def show_text(self, text, auto_hide_ms=10000, error=False):
        self._apply_text_style(error)
        self.result_label.setText(text)
        self.setWindowOpacity(self.FULL_OPACITY)

        # Calculate card width from text
        metrics = QFontMetrics(self.result_label.font())
        longest_line = max(text.splitlines() or [""])
        text_w = metrics.horizontalAdvance(longest_line) + 32
        card_width = max(self.MIN_WIDTH, min(self.MAX_WIDTH, text_w))
        self.card.setFixedWidth(card_width)

        # Let the scroll area handle height — cap visible area
        self.scroll.setMaximumHeight(self.MAX_VISIBLE_HEIGHT)

        self.card.adjustSize()
        self.adjustSize()
        self.show()
        self.raise_()
        self._auto_hide.stop()
        if auto_hide_ms:
            self._auto_hide.start(auto_hide_ms)

    def enterEvent(self, event):
        self._auto_hide.stop()
        self.setWindowOpacity(self.HOVER_OPACITY)
        super().enterEvent(event)

    def leaveEvent(self, event):
        self.setWindowOpacity(self.FULL_OPACITY)
        self._auto_hide.start(1800)
        super().leaveEvent(event)

    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton:
            self._drag_offset = event.globalPos() - self.frameGeometry().topLeft()
            event.accept()

    def mouseMoveEvent(self, event):
        if self._drag_offset is not None and event.buttons() & Qt.LeftButton:
            self.move(event.globalPos() - self._drag_offset)
            event.accept()

    def mouseReleaseEvent(self, event):
        self._drag_offset = None
        super().mouseReleaseEvent(event)
