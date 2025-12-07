from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
import os
import logging

HF_MODEL_ID = os.environ.get("HF_MODEL_ID")

logger = logging.getLogger("api.image.classifier")

classifier_pipeline = None

def load_text_classifier():
    global classifier_pipeline
    if classifier_pipeline is None:
        logger.info("[Classifier] Loading HF classifier...")
        tokenizer = AutoTokenizer.from_pretrained(HF_MODEL_ID)
        model = AutoModelForSequenceClassification.from_pretrained(HF_MODEL_ID)
        classifier_pipeline = pipeline("text-classification", model=model, tokenizer=tokenizer, device=0)
    return classifier_pipeline

def classify_text(text, classifier):
    res = classifier(text)[0]
    return res["label"], res["score"]
