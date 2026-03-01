import os
import shutil
import random
from PIL import Image
from tqdm import tqdm

# =========================
# CONFIG
# =========================

MURA_ROOT = "MURA-v1.1/train"

UPPER_LIMB_PARTS = [
    "XR_HAND",
    "XR_WRIST",
    "XR_ELBOW",
    "XR_FOREARM"
]

TRAIN_RATIO = 0.8
IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg")

BODY_PART_DATASET = "dataset_bodypart"
FRACTURE_DATASET = "dataset_fracture"

# =========================
# CREATE OUTPUT FOLDERS
# =========================

def create_folders():
    for split in ["train", "val"]:
        # Body-part dataset
        for part in UPPER_LIMB_PARTS:
            os.makedirs(os.path.join(BODY_PART_DATASET, split, part), exist_ok=True)

        # Fracture dataset
        for label in ["fracture", "normal"]:
            os.makedirs(os.path.join(FRACTURE_DATASET, split, label), exist_ok=True)

# =========================
# IMAGE VALIDATION
# =========================

def is_valid_image(path):
    try:
        img = Image.open(path)
        img.verify()
        return True
    except:
        return False

# =========================
# COLLECT DATA
# =========================

bodypart_data = []
fracture_data = []

print("🔍 Scanning MURA upper-limb data...")

for part in UPPER_LIMB_PARTS:
    part_path = os.path.join(MURA_ROOT, part)
    if not os.path.exists(part_path):
        continue

    for patient in os.listdir(part_path):
        patient_path = os.path.join(part_path, patient)
        if not os.path.isdir(patient_path):
            continue

        for study in os.listdir(patient_path):
            study_path = os.path.join(patient_path, study)
            if not os.path.isdir(study_path):
                continue

            # Fracture label from study name
            fracture_label = "fracture" if "positive" in study.lower() else "normal"

            for img in os.listdir(study_path):
                if img.lower().endswith(IMAGE_EXTENSIONS):
                    img_path = os.path.join(study_path, img)

                    if is_valid_image(img_path):
                        bodypart_data.append((img_path, part))
                        fracture_data.append((img_path, fracture_label))

print(f"Total images collected: {len(bodypart_data)}")

# =========================
# SHUFFLE & SPLIT
# =========================

def split_data(data):
    random.shuffle(data)
    split_idx = int(len(data) * TRAIN_RATIO)
    return data[:split_idx], data[split_idx:]

bp_train, bp_val = split_data(bodypart_data)
fx_train, fx_val = split_data(fracture_data)

# =========================
# COPY FILES
# =========================

def copy_images(data, base_dir, split):
    for src, label in tqdm(data, desc=f"{base_dir}/{split}"):
        filename = f"{random.randint(100000,999999)}_{os.path.basename(src)}"
        dst = os.path.join(base_dir, split, label, filename)
        if not os.path.exists(dst):
            shutil.copy(src, dst)

create_folders()

copy_images(bp_train, BODY_PART_DATASET, "train")
copy_images(bp_val, BODY_PART_DATASET, "val")

copy_images(fx_train, FRACTURE_DATASET, "train")
copy_images(fx_val, FRACTURE_DATASET, "val")

print("\n✅ DATA CLEANING & ORGANIZATION COMPLETE")
print("📁 Created:")
print(" - dataset_bodypart/")
print(" - dataset_fracture/")
