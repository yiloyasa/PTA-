"""Offline NLLB-200 Distilled 600M translator."""
import os
import sysconfig
import threading

MODEL_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "离线翻译引擎"
)


class OfflineTranslator:
    MODEL_NAME = "facebook/nllb-200-distilled-600M"
    LANGUAGE_CODES = {"zh": "zho_Hans", "en": "eng_Latn"}
    MODEL_FILES = (
        "model.safetensors",
        "model.safetensors.index.json",
        "pytorch_model.bin",
        "pytorch_model.bin.index.json",
    )

    def __init__(self, model_path=None, device="cpu"):
        self.model_path = model_path or MODEL_DIR
        self.device = device
        self._load_lock = threading.Lock()
        self._loaded = False
        self.tokenizer = None
        self.model = None

    def is_model_available(self):
        return (
            os.path.isfile(os.path.join(self.model_path, "config.json"))
            and any(
                os.path.isfile(os.path.join(self.model_path, file_name))
                for file_name in self.MODEL_FILES
            )
        )

    def ensure_loaded(self):
        if self._loaded:
            return
        with self._load_lock:
            if self._loaded:
                return
            self._load_model()

    def _load_model(self):
        if not self.is_model_available():
            raise RuntimeError(f"离线模型未安装：{self.model_path}")

        try:
            if os.name == "nt":
                torch_lib = os.path.join(
                    sysconfig.get_paths()["purelib"], "torch", "lib"
                )
                if os.path.isdir(torch_lib):
                    os.add_dll_directory(torch_lib)
                    os.add_dll_directory(os.path.dirname(torch_lib))
            import torch
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
        except (ImportError, OSError) as error:
            raise RuntimeError(f"离线运行环境不可用：{error}") from error

        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_path, local_files_only=True
        )
        self.model = AutoModelForSeq2SeqLM.from_pretrained(
            self.model_path, local_files_only=True
        )
        self.model.to(self.device)
        self.model.eval()
        self._loaded = True

    def translate(self, text, from_lang, to_lang):
        self.ensure_loaded()
        import torch

        source_code = self.LANGUAGE_CODES[from_lang]
        target_code = self.LANGUAGE_CODES[to_lang]
        self.tokenizer.src_lang = source_code
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
        )
        inputs = {name: value.to(self.device) for name, value in inputs.items()}
        target_token_id = self.tokenizer.convert_tokens_to_ids(target_code)

        with torch.inference_mode():
            output = self.model.generate(
                **inputs,
                forced_bos_token_id=target_token_id,
                max_new_tokens=512,
                num_beams=4,
                early_stopping=True,
            )
        return self.tokenizer.decode(output[0], skip_special_tokens=True).strip()
