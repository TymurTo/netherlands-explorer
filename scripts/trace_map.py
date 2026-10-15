from pathlib import Path
import json
import sys
import cv2
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[1]
colors = json.loads((root / "scripts/map-colors.json").read_text())
rgba = np.array(Image.open(sys.argv[1]).convert("RGBA"))
geometry = []
for province_id, color in colors.items():
    distance = np.linalg.norm(rgba[:, :, :3].astype(float) - color, axis=2)
    mask = ((distance < 22) & (rgba[:, :, 3] > 128)).astype("uint8") * 255

    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    paths = []
    boxes = []
    largest = max(contours, key=cv2.contourArea)
    moments = cv2.moments(largest)
    for contour in contours:
        if cv2.contourArea(contour) < 1000:
            continue

        bx, by, bw, bh = cv2.boundingRect(contour)
        if province_id == "zeeland" and by < 1250:
            continue
        if province_id == "limburg" and by < 1200:
            continue
        points = cv2.approxPolyDP(contour, 2, True)[:, 0, :]
        paths.append("M" + "L".join(f"{x},{y}" for x, y in points) + "Z")
        boxes.append(cv2.boundingRect(contour))
    x = min(b[0] for b in boxes)
    y = min(b[1] for b in boxes)
    right = max(b[0] + b[2] for b in boxes)
    bottom = max(b[1] + b[3] for b in boxes)
    geometry.append(
        dict(
            id=province_id,
            d=" ".join(paths),
            box=[x - 45, y - 45, right - x + 90, bottom - y + 90],
            label=[int(moments["m10"] / moments["m00"]), int(moments["m01"] / moments["m00"])],
        )
    )
(root / "frontend/src/data/map.json").write_text(json.dumps(geometry))
print(f"Created vector geometry: {len(geometry)} provinces")
