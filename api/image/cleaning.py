import re

def clean_ocr_text(text):
    text = re.sub(r"[^\x00-\x7F]+", " ", text)
    text = re.sub(r"[•●▪■▶►¤]", " ", text)
    text = text.replace("‘","'").replace("’","'")
    text = text.replace("“",'"').replace("”",'"')
    text = text.replace("–","-").replace("—","-")
    text = re.sub(r"[_\-]{2,}", " ", text)
    text = re.sub(r"(\w)[_\-]+(\w)", r"\1 \2", text)

    def remove_skill_noise(t):
        toks = t.split()
        cleaned = []
        for tok in toks:
            if tok.lower() in ["e","o","0","@"]:
                continue
            if re.fullmatch(r"[eEaAoO][0-9]", tok):
                continue
            if re.fullmatch(r"[0-9][eEaAoO]", tok):
                continue
            if re.fullmatch(r"[eEaAoO0@]{2,}", tok):
                continue
            cleaned.append(tok)
        return " ".join(cleaned)

    text = remove_skill_noise(text)
    text = re.sub(r"(\d+)([A-Za-z])", r"\1 \2", text)
    text = re.sub(r"\s+", " ", text)
    text = text.strip()
    return text
