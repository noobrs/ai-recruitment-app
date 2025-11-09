import cv2
from inference_sdk import InferenceHTTPClient
import supervision as sv

# Roboflow model config
API_URL = "https://detect.roboflow.com"
API_KEY = "67vTN3GIuCG6ku9YuVlu"
MODEL_ID = "resume-images/8"

CLIENT = InferenceHTTPClient(api_url=API_URL, api_key=API_KEY)

def detect_segments(img_path: str):
    """Detects resume layout segments using Roboflow/YOLO model."""
    result = CLIENT.infer(img_path, model_id=MODEL_ID)
    detections = sv.Detections.from_inference(result)
    boxes = []
    for i, det in enumerate(result["predictions"]):
        conf = det["confidence"]
        if conf < 0.6:
            continue
        x_min = int(det["x"] - det["width"] / 2)
        y_min = int(det["y"] - det["height"] / 2)
        x_max = int(det["x"] + det["width"] / 2)
        y_max = int(det["y"] + det["height"] / 2)
        boxes.append((x_min, y_min, x_max, y_max))
    return boxes
