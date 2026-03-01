"""
Prepare combined dataset for DenseNet121 training.
Combines: FracAtlas + LERA + MURA into binary classification (fracture vs normal).

Output:
  ai_models/classification/dataset_combined/
    train/fracture/  train/normal/
    val/fracture/    val/normal/
"""

import os
import csv
import shutil
import random
from pathlib import Path
from PIL import Image, ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True
random.seed(42)

# ---- PATHS ----
PROJECT = Path(__file__).resolve().parent
AI = PROJECT / "ai_models"

FRACATLAS = AI / "FracAtlas"
LERA = AI / "LERA Dataset"
MURA = AI / "classification" / "data" / "MURA-v1.1"

OUT = AI / "classification" / "dataset_combined"
SPLIT = 0.8


def is_valid_image(path):
    """Check if an image can actually be opened."""
    try:
        img = Image.open(path)
        img.load()
        return True
    except Exception:
        return False


def copy_safe(files, dst, prefix):
    """Copy files to dst, skipping bad images. Returns count."""
    count = 0
    for f in files:
        if is_valid_image(f):
            name = f"{prefix}_{count}_{f.name}"
            try:
                shutil.copy2(f, dst / name)
                count += 1
            except Exception:
                pass
    return count


def main():
    # Create output dirs
    for split in ["train", "val"]:
        for cls in ["fracture", "normal"]:
            (OUT / split / cls).mkdir(parents=True, exist_ok=True)

    print("=" * 50)
    print("RadiAI - Combined Dataset Preparation")
    print("=" * 50)

    # ---- 1. FracAtlas ----
    print("\n[1/3] FracAtlas...")
    fa_frac = list((FRACATLAS / "images" / "Fractured").glob("*.*"))
    fa_norm = list((FRACATLAS / "images" / "Non_fractured").glob("*.*"))
    random.shuffle(fa_frac)
    random.shuffle(fa_norm)

    s1 = int(len(fa_frac) * SPLIT)
    s2 = int(len(fa_norm) * SPLIT)

    c1 = copy_safe(fa_frac[:s1], OUT / "train" / "fracture", "fa")
    c2 = copy_safe(fa_frac[s1:], OUT / "val" / "fracture", "fa")
    c3 = copy_safe(fa_norm[:s2], OUT / "train" / "normal", "fa")
    c4 = copy_safe(fa_norm[s2:], OUT / "val" / "normal", "fa")
    print(f"  Fracture: {c1} train, {c2} val")
    print(f"  Normal:   {c3} train, {c4} val")

    # ---- 2. LERA ----
    print("\n[2/3] LERA...")
    lera_frac, lera_norm = [], []
    labels_file = LERA / "labels.csv"
    if labels_file.exists():
        with open(labels_file, "r") as f:
            raw = f.read().replace('\r\n', '\n').replace('\r', '\n')
        for line in raw.split('\n'):
            line = line.strip()
            if not line:
                continue
            parts = line.split(',')
            if len(parts) >= 3:
                pid, frac = parts[0].strip(), int(parts[2].strip())
                pdir = LERA / pid
                if pdir.exists():
                    imgs = list(pdir.rglob("*.png")) + list(pdir.rglob("*.jpg"))
                    if frac == 1:
                        lera_frac.extend(imgs)
                    else:
                        lera_norm.extend(imgs)

    random.shuffle(lera_frac)
    random.shuffle(lera_norm)
    s1 = int(len(lera_frac) * SPLIT)
    s2 = int(len(lera_norm) * SPLIT)

    c1 = copy_safe(lera_frac[:s1], OUT / "train" / "fracture", "lera")
    c2 = copy_safe(lera_frac[s1:], OUT / "val" / "fracture", "lera")
    c3 = copy_safe(lera_norm[:s2], OUT / "train" / "normal", "lera")
    c4 = copy_safe(lera_norm[s2:], OUT / "val" / "normal", "lera")
    print(f"  Fracture: {c1} train, {c2} val")
    print(f"  Normal:   {c3} train, {c4} val")

    # ---- 3. MURA ----
    print("\n[3/3] MURA...")
    mura_frac, mura_norm = [], []
    for split_name in ["train", "valid"]:
        split_dir = MURA / split_name
        if not split_dir.exists():
            continue
        for body_part in split_dir.iterdir():
            if not body_part.is_dir():
                continue
            for patient in body_part.iterdir():
                if not patient.is_dir():
                    continue
                for study in patient.iterdir():
                    if not study.is_dir():
                        continue
                    imgs = list(study.glob("*.png"))
                    sname = study.name.lower()
                    if "positive" in sname:
                        mura_frac.extend(imgs)
                    elif "negative" in sname:
                        mura_norm.extend(imgs)

    random.shuffle(mura_frac)
    random.shuffle(mura_norm)
    s1 = int(len(mura_frac) * SPLIT)
    s2 = int(len(mura_norm) * SPLIT)

    c1 = copy_safe(mura_frac[:s1], OUT / "train" / "fracture", "mura")
    c2 = copy_safe(mura_frac[s1:], OUT / "val" / "fracture", "mura")
    c3 = copy_safe(mura_norm[:s2], OUT / "train" / "normal", "mura")
    c4 = copy_safe(mura_norm[s2:], OUT / "val" / "normal", "mura")
    print(f"  Fracture: {c1} train, {c2} val")
    print(f"  Normal:   {c3} train, {c4} val")

    # ---- Summary ----
    for split in ["train", "val"]:
        for cls in ["fracture", "normal"]:
            n = len(list((OUT / split / cls).iterdir()))
            print(f"  {split}/{cls}: {n}")
    print(f"\nOutput: {OUT}")
    print("Done!")


if __name__ == "__main__":
    main()
