from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, File
import shutil, os, torch, base64, cv2

from models.model import load_yolo_model
from models.cam_bbox import generate_cam

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    yolo_model = load_yolo_model()
except Exception as e:
    print(f"⚠️ Could not load YOLO model (might not be trained yet): {e}")
    yolo_model = None

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output", "cam_results")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.post("/analyze")
async def analyze_xray(file: UploadFile = File(...)):
    # ---- Save upload ----
    image_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # ---- Output path ----
    output_path = os.path.join(OUTPUT_DIR, file.filename)

    # ---- CAM + prediction ----
    result = generate_cam(
        model=None,
        img_tensor=None,
        original_image_path=image_path,
        output_path=output_path,
        yolo_model=yolo_model
    )

    label = "Fracture" if result["pred_class"] == 1 else "Normal"

    # ---- Encode SAVED image ----
    img = cv2.imread(output_path)
    _, buffer = cv2.imencode(".png", img)
    cam_base64 = base64.b64encode(buffer).decode("utf-8")

    return {
        "prediction": label,
        "confidence": round(result["confidence"] * 100, 2),
        "cam_image": cam_base64
    }
