import torch
import numpy as np
import cv2
import os

def generate_cam(model, img_tensor, original_image_path, output_path, yolo_model=None):
    """
    Revised to only use YOLO for detection (ignoring DenseNet params).
    If YOLO finds a bounding box -> Fracture
    Else -> Normal
    """
    original = cv2.imread(original_image_path)
    overlay = original.copy()
    h, w, _ = original.shape

    yolo_detected = False
    pred_class = 0
    confidence = 0.90 # Default Normal confidence

    if yolo_model:
        # Run YOLO inference on the original image with a low confidence threshold
        res = yolo_model(original, conf=0.01)[0]
        if len(res.boxes) > 0:
            # Check maximum confidence in all detected boxes
            best_conf = 0.0
            best_box = None
            for box in res.boxes:
                conf_val = box.conf[0].item()
                if conf_val > best_conf:
                    best_conf = conf_val
                    best_box = box

            if best_conf >= 0.01:  # Very low threshold to catch YOLO fracture markers
                b = best_box.xyxy[0].cpu().numpy()
                x1, y1, x2, y2 = int(b[0]), int(b[1]), int(b[2]), int(b[3])
                
                # Draw YOLO box in RED
                cv2.rectangle(overlay, (x1, y1), (x2, y2), (0, 0, 255), 4)
                cv2.putText(overlay, f"Fracture Target ({best_conf*100:.1f}%)", (x1, max(y1-10, 20)), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                
                yolo_detected = True
                pred_class = 1  # Fracture
                confidence = best_conf

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    cv2.imwrite(output_path, overlay)

    return {
        "pred_class": pred_class,
        "confidence": confidence,
        "output_path": output_path
    }

