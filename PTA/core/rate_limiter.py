"""Per-text translation rate limiter."""
import hashlib
import time


class TranslationRateLimiter:
    MAX_COUNT = 3
    COOLDOWN_SECONDS = 10

    def __init__(self, clock=time.monotonic):
        self._clock = clock
        self._entries = {}

    def get_status(self, text):
        key = self._key(text)
        if not key:
            return True, False, ""

        now = self._clock()
        count, blocked_until = self._entries.get(key, (0, 0.0))

        if blocked_until:
            if now < blocked_until:
                return False, True, "......"
            count, blocked_until = 0, 0.0
            self._entries[key] = (count, blocked_until)

        if count >= self.MAX_COUNT:
            self._entries[key] = (count, now + self.COOLDOWN_SECONDS)
            return False, True, "......"

        return True, False, ""

    def record(self, text):
        key = self._key(text)
        if not key:
            return
        count, blocked_until = self._entries.get(key, (0, 0.0))
        self._entries[key] = (count + 1, blocked_until)

    @staticmethod
    def _key(text):
        normalized = " ".join(text.strip().split())
        if not normalized:
            return ""
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
