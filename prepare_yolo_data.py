"""
Prepare YOLO dataset for fracture localization training.
Uses FracAtlas images + YOLO annotations (only fractured images).

Output structure:
  datasets/fracture/
    images/
      train/
      val/
    labels/
      train/
      val/
    data.yaml
"""

import os
import shutil
import random
import csv
from pathlib import Path

random.seed(42)

# ───────────── PATHS ─────────────
PROJECT_ROOT = Path(__file__).resolve().parent
AI_MODELS = PROJECT_ROOT / "ai_models"

FRACATLAS_DIR = AI_MODELS / "FracAtlas"
FRACATLAS_CSV = FRACATLAS_DIR / "dataset.csv"
FRACATLAS_IMAGES = FRACATLAS_DIR / "images"
FRACATLAS_YOLO = FRACATLAS_DIR / "Annotations" / "YOLO"

OUTPUT_DIR = AI_MODELS / "detection" / "yolo" / "datasets" / "fracture"
IMAGES_TRAIN = OUTPUT_DIR / "images" / "train"
IMAGES_VAL = OUTPUT_DIR / "images" / "val"
LABELS_TRAIN = OUTPUT_DIR / "labels" / "train"
LABELS_VAL = OUTPUT_DIR / "labels" / "val"

SPLIT_RATIO = 0.8


def setup_dirs():
    for d in [IMAGES_TRAIN, IMAGES_VAL, LABELS_TRAIN, LABELS_VAL]:
        d.mkdir(parents=True, exist_ok=True)
    print("✅ Output directories created")


def get_fractured_images():
    """Read dataset.csv to find all fractured images."""
    fractured = []

    with open(FRACATLAS_CSV, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if int(row["fractured"]) >= 1:
                image_id = row["image_id"]
                fractured.append(image_id)

    return fractured


def main():
    print("=" * 50)
    print("RadiAI — YOLO Dataset Preparation")
    print("=" * 50)

    setup_dirs()

    # Get fractured image IDs from CSV
    fractured_ids = get_fractured_images()
    print(f"\n📊 Found {len(fractured_ids)} fractured images in dataset.csv")

    # Find actual image + label files
    valid_pairs = []
    missing_img = 0
    missing_lbl = 0
    empty_lbl = 0

    for img_id in fractured_ids:
        # Find image file (could be in Fractured or Non_fractured folder)
        img_path = None
        for subdir in ["Fractured", "Non_fractured"]:
            candidate = FRACATLAS_IMAGES / subdir / img_id
            if candidate.exists():
                img_path = candidate
                break

        if img_path is None:
            missing_img += 1
            continue

        # Find label file
        label_name = img_id.rsplit(".", 1)[0] + ".txt"
        label_path = FRACATLAS_YOLO / label_name

        if not label_path.exists():
            missing_lbl += 1
            continue

        # Check label is not empty
        if label_path.stat().st_size == 0:
            empty_lbl += 1
            continue

        valid_pairs.append((img_path, label_path))

    print(f"  Valid pairs:    {len(valid_pairs)}")
    print(f"  Missing images: {missing_img}")
    print(f"  Missing labels: {missing_lbl}")
    print(f"  Empty labels:   {empty_lbl}")

    # Shuffle and split
    random.shuffle(valid_pairs)
    split = int(len(valid_pairs) * SPLIT_RATIO)
    train_pairs = valid_pairs[:split]
    val_pairs = valid_pairs[split:]

    # Copy files
    for img_path, lbl_path in train_pairs:
        shutil.copy2(img_path, IMAGES_TRAIN / img_path.name)
        shutil.copy2(lbl_path, LABELS_TRAIN / lbl_path.name)

    for img_path, lbl_path in val_pairs:
        shutil.copy2(img_path, IMAGES_VAL / img_path.name)
        shutil.copy2(lbl_path, LABELS_VAL / lbl_path.name)

    print(f"\n📂 Train: {len(train_pairs)} images")
    print(f"📂 Val:   {len(val_pairs)} images")

    # Create data.yaml
    yaml_content = f"""path: {OUTPUT_DIR.as_posix()}
train: images/train
val: images/val

names:
  0: fracture
"""
    yaml_path = OUTPUT_DIR / "data.yaml"
    with open(yaml_path, "w") as f:
        f.write(yaml_content)

    print(f"\n✅ data.yaml created: {yaml_path}")
    print(f"✅ Output: {OUTPUT_DIR}")
    print("=" * 50)


if __name__ == "__main__":
    main()
