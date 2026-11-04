"""Crop the stable legacy content, mask only the newly added export controls, and sweep pixel thresholds."""
from pathlib import Path
import json
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[2] / "test-artifacts" / "accounting-receivables"
legacy = Image.open(root / "legacy.png").convert("RGB")
restored = Image.open(root / "restored.png").convert("RGB")
width = min(legacy.width, restored.width)
height = min(legacy.height, restored.height, 800)
box = (0, 170, width, height)
a = np.asarray(legacy.crop(box), dtype=np.int16)
b = np.asarray(restored.crop(box), dtype=np.int16)
# The PDF/Excel/CSV icons replace the legacy CSV button in this rectangle.
mask = np.zeros(a.shape[:2], dtype=bool)
mask[190:285, 1090:width] = True

def compare(dx, dy, threshold):
    x0, x1 = max(0, dx), min(a.shape[1], a.shape[1] + dx)
    y0, y1 = max(0, dy), min(a.shape[0], a.shape[0] + dy)
    diff = np.max(np.abs(a[y0:y1, x0:x1] - b[y0-dy:y1-dy, x0-dx:x1-dx]), axis=2)
    valid = ~mask[y0:y1, x0:x1]
    return int(np.count_nonzero((diff > threshold) & valid)), int(np.count_nonzero(valid))

best = min((compare(dx, dy, 32)[0], dx, dy) for dx in range(-4, 5) for dy in range(-4, 5))
_, dx, dy = best
report = {"crop": box, "masked": "new export controls only", "bestShift": [dx, dy],
          "thresholdSweep": {str(t): {"differentPixels": compare(dx, dy, t)[0],
                                      "percent": round(100 * compare(dx, dy, t)[0] / max(1, compare(dx, dy, t)[1]), 3)}
                             for t in [0, 4, 8, 16, 32, 64]}}
(root / "pixel-diff.json").write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
