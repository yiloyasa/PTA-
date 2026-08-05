"""Translation engine with Baidu primary and NLLB offline fallback."""
import threading

from core.baidu_translator import BaiduTranslator
from core.language_detector import detect_language, get_source_target
from core.offline_translator import OfflineTranslator


class TranslationEngine:
    def __init__(self, config):
        self.config = config
        self._lock = threading.Lock()
        self._baidu = None
        self._baidu_credentials = None
        self._offline = OfflineTranslator(config.get_offline_model_path())

    def translate(self, text):
        text = text.strip()
        if not text:
            raise ValueError("没有可翻译的文本")

        source_language = detect_language(text)
        from_lang, to_lang = get_source_target(source_language)

        with self._lock:
            online_error = None
            app_id = self.config.get_baidu_app_id()
            app_secret = self.config.get_baidu_app_secret()

            if app_id and app_secret:
                try:
                    result = self._get_baidu(app_id, app_secret).translate(
                        text, from_lang, to_lang
                    )
                    return result, source_language
                except RuntimeError as error:
                    online_error = error

            if self._offline.is_model_available():
                result = self._offline.translate(text, from_lang, to_lang)
                return result, source_language

            if online_error:
                raise RuntimeError(f"{online_error}；离线模型未安装")
            raise RuntimeError("请先配置百度翻译 API，或安装 NLLB-200 离线模型")

    def _get_baidu(self, app_id, app_secret):
        credentials = (app_id, app_secret)
        if self._baidu is None or credentials != self._baidu_credentials:
            self._baidu = BaiduTranslator(app_id, app_secret)
            self._baidu_credentials = credentials
        return self._baidu
