"""Simple Chinese/English language detection."""


def detect_language(text):
    chinese_count = sum(1 for char in text if "\u3400" <= char <= "\u9fff")
    english_count = sum(1 for char in text if char.isascii() and char.isalpha())

    if chinese_count == 0 and english_count == 0:
        return "unknown"
    if chinese_count == 0:
        return "en"
    if english_count == 0:
        return "zh"

    return "zh" if chinese_count > english_count else "en"


def get_source_target(source_language):
    if source_language == "zh":
        return "zh", "en"
    return "en", "zh"