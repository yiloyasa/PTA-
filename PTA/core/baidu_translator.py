"""Baidu translation API client."""
import hashlib
import threading
import time
import uuid

import requests


class BaiduTranslator:
    BASE_URL = "https://fanyi-api.baidu.com/api/trans/vip/translate"
    MIN_INTERVAL_SECONDS = 1.2
    MAX_RETRIES = 3

    def __init__(self, app_id, app_secret):
        self.app_id = app_id
        self.app_secret = app_secret
        self._last_request_at = 0.0
        self._request_lock = threading.Lock()

    def translate(self, text, from_lang, to_lang):
        if not self.app_id or not self.app_secret:
            raise RuntimeError("百度翻译 API 尚未配置")

        with self._request_lock:
            last_error = None
            for attempt in range(self.MAX_RETRIES):
                self._wait_for_rate_limit()
                try:
                    data = self._request(text, from_lang, to_lang)
                except requests.exceptions.Timeout:
                    last_error = RuntimeError("百度翻译请求超时")
                    continue
                except requests.exceptions.ConnectionError:
                    last_error = RuntimeError("无法连接百度翻译，请检查网络")
                    continue
                except requests.exceptions.RequestException as error:
                    raise RuntimeError(f"百度翻译网络错误：{error}") from error

                error_code = str(data.get("error_code", ""))
                if error_code:
                    message = data.get("error_msg", error_code)
                    if error_code in {"54003", "54005"}:
                        last_error = RuntimeError("百度翻译请求过于频繁")
                        time.sleep(1.5)
                        continue
                    raise RuntimeError(f"百度翻译 API 错误：{message}")

                items = data.get("trans_result") or []
                result = "\n".join(item.get("dst", "") for item in items).strip()
                if not result:
                    raise RuntimeError("百度翻译返回了空结果")
                return result

            raise last_error or RuntimeError("百度翻译失败")

    def _wait_for_rate_limit(self):
        remaining = self.MIN_INTERVAL_SECONDS - (time.monotonic() - self._last_request_at)
        if remaining > 0:
            time.sleep(remaining)

    def _request(self, text, from_lang, to_lang):
        salt = uuid.uuid4().hex
        sign_source = self.app_id + text + salt + self.app_secret
        sign = hashlib.md5(sign_source.encode("utf-8")).hexdigest()
        payload = {
            "q": text,
            "from": from_lang,
            "to": to_lang,
            "appid": self.app_id,
            "salt": salt,
            "sign": sign,
        }
        self._last_request_at = time.monotonic()
        response = requests.post(self.BASE_URL, data=payload, timeout=12)
        response.raise_for_status()
        return response.json()
