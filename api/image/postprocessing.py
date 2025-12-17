import re

def clean_ocr_text(text):
    text = re.sub(r"[^\x00-\x7F]+", " ", text)
    text = re.sub(r"[•●▪■▶►¤]", " ", text)
    text = text.replace("‘","'").replace("’","'")
    text = text.replace("“",'"').replace("”",'"')
    text = text.replace("–","-").replace("—","-")
    text = re.sub(r"[_\-]{2,}", " ", text)
    text = re.sub(r"(\w)[_\-]+(\w)", r"\1 \2", text)
    text = re.sub(r"(\d+)([A-Za-z])", r"\1 \2", text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s*-\s+", "\n- ", text)
    text = text.strip()
    return text
