import os
import logging
from inference_sdk import InferenceHTTPClient

API_URL = os.environ.get("ROBOFLOW_API_URL")
API_KEY = os.environ.get("ROBOFLOW_API_KEY")
MODEL_ID = os.environ.get("ROBOFLOW_MODEL_ID")

logger = logging.getLogger("api.image.segmentation")
CLIENT = None

def _get_client():
    global CLIENT
    if CLIENT is None:
        CLIENT = InferenceHTTPClient(api_url=API_URL, api_key=API_KEY)
    return CLIENT

def run_detection(image_path, model_id=None):
    logger.info(f"[Detect] Running detection on: {image_path}")
    client = _get_client()
    mid = model_id or MODEL_ID
    result = client.infer(image_path, model_id=mid)
    return result

def detections_to_predictions(result):
    preds = result.get("predictions", []) if isinstance(result, dict) else []
    logger.info(f"[Detect] {len(preds)} predictions extracted")
    return preds
