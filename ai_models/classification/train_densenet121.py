"""
DenseNet121 Binary Classifier: Fracture vs Normal
Trained on combined FracAtlas + LERA + MURA dataset.

HOW IT WORKS:
=============
1. Loads pretrained DenseNet121 (trained on ImageNet - 1M natural images)
2. Replaces final layer: 1000 classes -> 2 classes (fracture, normal)
3. Fine-tunes on our X-ray data with augmentation (flip, rotate, color jitter)
4. Each epoch: train on all images -> validate -> save best model
5. Output: densenet121_combined_final.pth (best validation accuracy checkpoint)

WHY DenseNet121:
- Dense connections = better gradient flow = better feature reuse
- Pretrained on ImageNet = already knows edges, textures, shapes
- Only 8M params = fast to fine-tune, works great on medical images
"""

import os
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
from tqdm import tqdm
from pathlib import Path
from PIL import ImageFile

ImageFile.LOAD_TRUNCATED_IMAGES = True

# ---- CONFIG ----
SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR / "dataset_combined" / "train"
VAL_DIR = SCRIPT_DIR / "dataset_combined" / "val"
CHECKPOINT_DIR = SCRIPT_DIR / "checkpoints"
CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = CHECKPOINT_DIR / "densenet121_combined_final.pth"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

BATCH_SIZE = 16
EPOCHS = 10
LR = 1e-4

print(f"Device: {DEVICE}")

# ---- DATA AUGMENTATION ----
# Random flips/rotations/color changes make model robust to image variations
train_tf = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

val_tf = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# ---- SAFE DATASET (skip corrupted images) ----
class SafeImageFolder(datasets.ImageFolder):
    def __getitem__(self, index):
        try:
            return super().__getitem__(index)
        except Exception:
            return None

def safe_collate(batch):
    batch = [b for b in batch if b is not None]
    if not batch:
        return torch.zeros(1, 3, 224, 224), torch.zeros(1, dtype=torch.long)
    return torch.utils.data.dataloader.default_collate(batch)

# ---- LOAD DATA ----
print(f"Train: {DATA_DIR}")
print(f"Val:   {VAL_DIR}")

train_ds = SafeImageFolder(str(DATA_DIR), transform=train_tf)
val_ds = SafeImageFolder(str(VAL_DIR), transform=val_tf)

train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=0, collate_fn=safe_collate)
val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=0, collate_fn=safe_collate)

print(f"Classes: {train_ds.classes}")
print(f"Train: {len(train_ds)} | Val: {len(val_ds)}")

# ---- MODEL ----
# Load pretrained DenseNet121, replace classifier head for 2 classes
model = models.densenet121(weights="IMAGENET1K_V1")
model.classifier = nn.Linear(model.classifier.in_features, 2)
model = model.to(DEVICE)

criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=LR)

# ---- TRAINING LOOP ----
best_acc = 0.0

for epoch in range(EPOCHS):
    # -- Train --
    model.train()
    correct, total, running_loss = 0, 0, 0

    loop = tqdm(train_loader, desc=f"Epoch {epoch+1}/{EPOCHS} [Train]")
    for images, labels in loop:
        images, labels = images.to(DEVICE), labels.to(DEVICE)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        preds = outputs.argmax(1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)
        loop.set_postfix(loss=f"{loss.item():.3f}", acc=f"{correct/total:.3f}")

    train_acc = correct / total

    # -- Validate --
    model.eval()
    val_correct, val_total = 0, 0
    with torch.no_grad():
        for images, labels in val_loader:
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            preds = model(images).argmax(1)
            val_correct += (preds == labels).sum().item()
            val_total += labels.size(0)
    val_acc = val_correct / val_total

    print(f"Epoch {epoch+1} | Train Acc: {train_acc:.4f} | Val Acc: {val_acc:.4f}")

    # Save best model
    if val_acc > best_acc:
        best_acc = val_acc
        torch.save(model.state_dict(), str(MODEL_PATH))
        print(f"  -> Best model saved (val_acc={val_acc:.4f})")

print(f"\nDone! Best val accuracy: {best_acc:.4f}")
print(f"Model saved: {MODEL_PATH}")
