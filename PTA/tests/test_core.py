"""Core tests for PTA."""
import os

from _bootstrap import PROJECT_ROOT  # noqa: F401

from core.language_detector import detect_language, get_source_target
from core.rate_limiter import TranslationRateLimiter
from config.app_config import AppConfig


def test_language_detection():
    assert detect_language("Hello world") == "en"
    assert detect_language("她说话的小毛病") == "zh"
    # 含英文字符（纯英文或中英混排）一律按英文处理，译成中文
    assert detect_language("Hello 你好") == "en"
    assert detect_language("机器学习很有趣 machine learning") == "en"
    assert get_source_target("en") == ("en", "zh")
    assert get_source_target("zh") == ("zh", "en")


def test_rate_limiter_per_text():
    now = [0.0]
    limiter = TranslationRateLimiter(clock=lambda: now[0])

    for _ in range(3):
        assert limiter.get_status("hello")[0] is True
        limiter.record("hello")

    assert limiter.get_status("hello")[0] is False
    assert limiter.get_status("world")[0] is True

    now[0] = 11.0
    assert limiter.get_status("hello")[0] is True


def test_config_shape():
    config = AppConfig()
    assert config.get_config_path().endswith(os.path.join("config", "config.json"))
    assert config.get_offline_model_path().endswith("离线翻译引擎")
    assert isinstance(config.get_hotkey(), str)


if __name__ == "__main__":
    test_language_detection()
    test_rate_limiter_per_text()
    test_config_shape()
    print("CORE_TESTS_OK")
