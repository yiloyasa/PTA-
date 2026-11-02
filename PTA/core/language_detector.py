"""Simple Chinese/English language detection."""


def detect_language(text):
    chinese_count = sum(1 for char in text if "\u3400" <= char <= "\u9fff")
    english_count = sum(1 for char in text if char.isascii() and char.isalpha())

    if chinese_count == 0 and english_count == 0:
        return "unknown"
    # 只有纯中文才译成英文；含英文字符（纯英文或中英混排）一律译成中文。
    return "en" if english_count else "zh"


def get_source_target(source_language):
    if source_language == "zh":
        return "zh", "en"
    return "en", "zh"