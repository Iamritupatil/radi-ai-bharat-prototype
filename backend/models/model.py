import os
import torch
from torchvision import models
import torch.nn as nn

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

def load_model():
    model = models.densenet121(weights=None)
    model.classifier = nn.Linear(model.classifier.in_features, 2)

    # ✅ Path to checkpoint (relative to project root)
    PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    MODEL_PATH = os.path.join(
        PROJECT_ROOT,
        "ai_models", "classification", "checkpoints",
        "densenet121_combined_final.pth"
    )

    print("✅ Loading DenseNet from:", MODEL_PATH)

    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.eval()
    model.to(DEVICE)

    return model

def load_yolo_model():
    from ultralytics import YOLO
    PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    YOLO_PATH = os.path.join(
        PROJECT_ROOT,
        "ai_models", "detection", "yolo", "runs", "fracture_detect", "weights", "best.pt"
    )
    print("✅ Loading YOLO from:", YOLO_PATH)
    return YOLO(YOLO_PATH)
