
import requests
import os

# Use the image uploaded by the user
IMAGE_PATH = r"C:\Users\RITU PATIL\.gemini\antigravity\brain\edfc69d0-bfdf-44eb-b19e-7e4dcf2635b6\uploaded_image_1768989691622.png"
URL = "http://127.0.0.1:8000/analyze"

if not os.path.exists(IMAGE_PATH):
    print(f"Image not found: {IMAGE_PATH}")
    exit(1)

print(f"Sending request to {URL} with image {IMAGE_PATH}...")
try:
    with open(IMAGE_PATH, "rb") as f:
        files = {"file": f}
        response = requests.post(URL, files=files)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code != 200:
        print("Error Response:", response.text)
    else:
        print("Success!")
        data = response.json()
        print("Keys:", data.keys())
        print("Prediction:", data.get("prediction"))
except Exception as e:
    print(f"Request failed: {e}")
