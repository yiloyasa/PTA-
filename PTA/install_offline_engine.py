"""Download NLLB-200 Distilled 600M into PTA/离线翻译引擎."""
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(ROOT, "离线翻译引擎")
os.makedirs(MODEL_DIR, exist_ok=True)

try:
    from huggingface_hub import snapshot_download
except ImportError:
    print("缺少 huggingface_hub，请先安装 requirements-offline.txt")
    raise SystemExit(1)

print("开始下载 NLLB-200 Distilled 600M，文件较大，请保持网络连接。")
snapshot_download(
    repo_id="facebook/nllb-200-distilled-600M",
    local_dir=MODEL_DIR,
)
print(f"离线模型已保存到：{MODEL_DIR}")
