"""
Wrapper around your Roboflow / InferenceHTTPClient usage.
Exposes detect_segments(image_path_or_bytes) -> list of boxes [[x1,y1,x2,y2], ...]
"""

import os
from typing import List, Tuple, Union
import cv2
import numpy as np
from inference_sdk import InferenceHTTPClient

# configure these from environment or constants
API_URL = os.environ.get("ROBOFLOW_API_URL", "https://detect.roboflow.com")
API_KEY = os.environ.get("ROBOFLOW_API_KEY", "67vTN3GIuCG6ku9YuVlu")
MODEL_ID = os.environ.get("ROBOFLOW_MODEL_ID", "resume-images/8")

CLIENT = InferenceHTTPClient(api_url=API_URL, api_key=API_KEY)

def _save_bytes_to_tempfile(image_bytes: bytes, suffix=".jpg"):
    import tempfile
    f = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    f.write(image_bytes)
    f.close()
    return f.name

def detect_segments(image_path_or_bytes: Union[str, bytes]) -> List[List[int]]:
    """
    Calls Roboflow inference, filters by confidence > 0.6,
    returns list of [x_min,y_min,x_max,y_max] boxes.
    Accepts a file path or raw bytes.
    """
    if isinstance(image_path_or_bytes, (bytes, bytearray)):
        tmp = _save_bytes_to_tempfile(image_path_or_bytes, suffix=".jpg")
        input_path = tmp
        remove_tmp = True
    else:
        input_path = image_path_or_bytes
        remove_tmp = False

    try:
        result = CLIENT.infer(input_path, model_id=MODEL_ID)
        boxes = []
        for p in result.get("predictions", []):
            conf = p.get("confidence", 0)
            if conf < 0.6:
                continue
            # roboflow returns center x,y,width,height
            cx = p["x"]; cy = p["y"]; w = p["width"]; h = p["height"]
            x_min = int(cx - w/2); y_min = int(cy - h/2)
            x_max = int(cx + w/2); y_max = int(cy + h/2)
            boxes.append([x_min, y_min, x_max, y_max])
        return boxes
    finally:
        if remove_tmp:
            try:
                os.remove(tmp)
            except Exception:
                pass
