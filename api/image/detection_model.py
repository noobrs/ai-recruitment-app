import supervision as sv
from inference_sdk import InferenceHTTPClient
from typing import List, Tuple

API_URL = "https://detect.roboflow.com"
API_KEY = "67vTN3GIuCG6ku9YuVlu"
MODEL_ID = "resume-images/8"

CLIENT = InferenceHTTPClient(api_url=API_URL, api_key=API_KEY)

def detect_segments(img_path: str, min_confidence: float = 0.60) -> List[Tuple[int,int,int,int]]:
    """Calls Roboflow inference and returns list of (x_min,y_min,x_max,y_max)."""
    result = CLIENT.infer(img_path, model_id=MODEL_ID)
    boxes = []
    for det in result.get("predictions", []):
        conf = det.get("confidence", 0)
        if conf < min_confidence:
            continue
        x_min = int(det["x"] - det["width"] / 2)
        y_min = int(det["y"] - det["height"] / 2)
        x_max = int(det["x"] + det["width"] / 2)
        y_max = int(det["y"] + det["height"] / 2)
        # clamp
        boxes.append((max(0, x_min), max(0, y_min), max(0, x_max), max(0, y_max)))
    return boxes
