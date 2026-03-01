"""
YOLOv8m Fracture Localization Model
Trained on FracAtlas dataset with bounding box annotations.

HOW IT WORKS:
=============
1. Loads YOLOv8m pretrained on COCO (80 object classes)
2. Retrains for 1 class: "fracture" (bounding box around fracture region)
3. Input: X-ray image (640x640)
4. Output: Bounding box [x, y, width, height] + confidence score
5. Uses mosaic augmentation, auto mixed precision for speed
6. Saves best.pt (highest mAP) and last.pt (final epoch)

WHY YOLOv8m:
- Real-time object detection (fast inference)
- Medium model = good accuracy vs speed balance
- Pretrained = already knows shapes/edges, just learns fracture patterns
- Single-class detection = focused and accurate
"""

from ultralytics import YOLO
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DATA_YAML = PROJECT_ROOT / "ai_models" / "detection" / "yolo" / "datasets" / "fracture" / "data.yaml"
OUTPUT_DIR = PROJECT_ROOT / "ai_models" / "detection" / "yolo" / "runs"

print(f"Data: {DATA_YAML}")
print(f"Output: {OUTPUT_DIR}")

if __name__ == '__main__':
    model = YOLO("yolov8m.pt")

    model.train(
        data=str(DATA_YAML),
        epochs=50,
        imgsz=512,        # Smaller image to fit 6GB GPU
        batch=4,          # Small batch for 6GB VRAM
        device=0,         # GPU 0
        project=str(OUTPUT_DIR),
        name="fracture_detect",
        patience=10,      # Stop if no improvement for 10 epochs
        save=True,
        save_period=5,
        pretrained=True,
        verbose=True,
        workers=0         # Windows compatibility
    )

    print("YOLO training complete!")
    print(f"Best weights: {OUTPUT_DIR / 'fracture_detect' / 'weights' / 'best.pt'}")
