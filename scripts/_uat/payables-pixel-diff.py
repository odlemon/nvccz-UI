"""Shift-search and threshold-sweep for the Payables parity screenshots."""
from pathlib import Path
import json
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[2] / "test-artifacts" / "accounting-payables"
a_image = Image.open(ROOT / "legacy.png").convert("RGB")
b_image = Image.open(ROOT / "restored-pinned.png").convert("RGB")
a = np.asarray(a_image, dtype=np.int16)
b = np.asarray(b_image, dtype=np.int16)
width, height = min(a.shape[1], b.shape[1]), min(a.shape[0], b.shape[0])

def count(dx, dy, threshold):
    x0, x1 = max(0, dx), min(width, width + dx)
    y0, y1 = max(0, dy), min(height, height + dy)
    left = a[y0:y1, x0:x1]
    right = b[y0-dy:y1-dy, x0-dx:x1-dx]
    return int(np.count_nonzero(np.max(np.abs(left - right), axis=2) > threshold))

best = min(((count(dx, dy, 32), dx, dy) for dx in range(-4, 5) for dy in range(-4, 5)))
_, dx, dy = best
report = {
    "legacySize": a_image.size,
    "restoredSize": b_image.size,
    "comparedSize": [width, height],
    "bestShift": [dx, dy],
    "thresholdSweep": {str(t): {"differentPixels": count(dx, dy, t), "percent": round(100 * count(dx, dy, t) / (width * height), 3)} for t in (0, 4, 8, 16, 32, 64)},
}
(ROOT / "pixel-diff.json").write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
