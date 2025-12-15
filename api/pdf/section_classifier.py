import re
from typing import Dict, List, Optional, Tuple

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from api.types.types import TextGroup
from api.pdf.config import COMMON_SECTION_HEADERS, SECTION_CLASSIFIER_MODEL, SECTION_MERGE_MAP
from api.pdf.redaction import is_email, is_phone
from api.pdf.entity_extraction import load_ner_model


# =============================================================================
# Model Loading
# =============================================================================

_MODEL = None
_TOKENIZER = None


def load_section_classifier() -> Tuple[AutoModelForSequenceClassification, AutoTokenizer]:
    global _MODEL, _TOKENIZER
    
    if _MODEL is None or _TOKENIZER is None:
        print(f"[SectionClassifier] Loading BERT model: {SECTION_CLASSIFIER_MODEL}...")
        _TOKENIZER = AutoTokenizer.from_pretrained(SECTION_CLASSIFIER_MODEL)
        _MODEL = AutoModelForSequenceClassification.from_pretrained(SECTION_CLASSIFIER_MODEL)
        _MODEL.eval()
        print("[SectionClassifier] BERT model loaded successfully.")
    
    return _MODEL, _TOKENIZER


# =============================================================================
# Helper
# =============================================================================

def set_first_span_label(group: TextGroup, new_label: str) -> bool:
    if group.spans:
        group.spans[0].label = new_label
        return True
    return False


# =============================================================================
# Fast-path Header Matching
# =============================================================================

# Flatten the config dict (Type -> [Headers]) into a lookup map (Header -> Type)
_HEADER_LOOKUP: Dict[str, str] = {
    header: section_type
    for section_type, headers in COMMON_SECTION_HEADERS.items()
    for header in headers
}

def clean_string(text):
    # 1. Replace characters that are NOT alphanumeric or whitespace with an empty string
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    
    # 2. Replace multiple spaces/tabs/newlines with a single space
    text = re.sub(r'\s+', ' ', text)
    
    # 3. Strip leading and trailing whitespace
    return text.lower().strip()


def match_common_header(heading: str) -> Optional[str]:  
    
    cleaned = clean_string(heading)
    if cleaned in _HEADER_LOOKUP:
        return _HEADER_LOOKUP[cleaned]
    
    return None


# =============================================================================
# Check if NO_HEADING have usage
# =============================================================================

def process_no_heading(group: TextGroup) -> Optional[TextGroup]:
    # Safety check (optional based on your flow, but good practice)
    if group.heading != "NO_HEADING":
        return group

    valid_spans = []
    
    # Check every span in the group
    for span in group.spans:
        is_header = match_common_header(span.text)
        
        # If is_header is None, it's NOT a header -> Keep it
        if is_header is None:
            valid_spans.append(span)
        else:
            # Optional: Log which headers are being removed
            print(f"Removing span '{span.text}' detected as header: {is_header}")
            pass

    # If valid spans remain, update and return the group
    if valid_spans:
        group.spans = valid_spans
        # Reconstruct full text based on remaining spans
        group.text = " ".join(s.text for s in valid_spans) 
        return group
    
    # If valid_spans is empty, return None to signal deletion
    print(f"[SectionClassifier] Dropped 'NO_HEADING' group (all spans were headers)")
    return None


# =============================================================================
# NER to heading for section classification
# =============================================================================

def resolve_heading_via_ner(group: TextGroup) -> bool:
    # Run NER on the heading text
    ner_model = load_ner_model()
    entities = ner_model.predict_entities(
        group.heading, 
        ["person name", "university", "company", "job title", "academic degree", "skill"]
    )
    
    # Check entities to determine section
    for entity in entities:
        label = entity['label']
        
        # 1. Contact Info / Header Detection
        # If the heading is a person's name, it's the Contact section.
        if label == "person name":
            group.heading = "contact"
            return True
            
        # If heading is a Job Title BUT the text contains email/phone, 
        # it is likely the resume header (e.g., "Software Engineer | yong@email.com"), not Experience.
        elif label == "job title" and (is_email(group.text) or is_phone(group.text)):
            group.heading = "contact"
            return True

        # 2. Experience Detection
        # Standard Job Titles or Company names usually denote Experience sections
        elif label in ["company", "job title"]:
            group.heading = "experience"
            # set the first span label to match the NER label (for record indication purposes)
            set_first_span_label(group, label)
            return True

        # 3. Education Detection
        elif label in ["university", "academic degree"]:
            group.heading = "education"
            # set the first span label to match the NER label (for record indication purposes)
            set_first_span_label(group, label)
            return True

    return False


# =============================================================================
# BERT Classification
# =============================================================================

def classify_text(model, tokenizer, text: str) -> Optional[str]:
    if not text or not text.strip():
        return None

    try:
        inputs = tokenizer(text.strip(), return_tensors="pt", truncation=True, max_length=512)
        
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            # Sort class indices by logits (descending)
            sorted_indices = torch.argsort(logits, dim=-1, descending=True).squeeze().tolist()
        
        # Find the best label that is not excluded
        for class_idx in sorted_indices:
            label = model.config.id2label.get(class_idx, "other").lower()
            if label not in {"para"}:
                return label
        
        return "other"
        
    except Exception as e:
        print(f"[SectionClassifier] Error classifying: {e}")
        return None
    
# =============================================================================
# Main Classification function
# =============================================================================

def classify_text_groups(groups: List[TextGroup]) -> List[TextGroup]:
    final_groups: List[TextGroup] = []
    model, tokenizer = load_section_classifier()

    for group in groups:
        # -----------------------------------------------------------
        # Step 1: Handle 'NO_HEADING' Special Case
        # -----------------------------------------------------------
        if group.heading == "NO_HEADING":
            group = process_no_heading(group)
            if group: 
                final_groups.append(group)
            continue 

        # We will modify 'group' in place and add to final list at the end
        
        # -----------------------------------------------------------
        # Step 2: Fast-Path (Dictionary Match)
        # -----------------------------------------------------------
        # Fastest check. O(1) lookup.
        matched_section = match_common_header(group.heading)
        if matched_section:
            group.heading = matched_section
            final_groups.append(group)
            continue

        # -----------------------------------------------------------
        # Step 3: NER Resolution (Heuristic)
        # -----------------------------------------------------------
        # Slower than dict, faster than BERT. Good for "University of X".
        if resolve_heading_via_ner(group):
            # If function returns True, group.heading is already updated
            final_groups.append(group)
            continue

        # -----------------------------------------------------------
        # Step 4: BERT Classification (Deep Learning Fallback)
        # -----------------------------------------------------------
        # Slowest. Use context from the body text to help classification.
        classification_text = group.heading
        if group.text:
            classification_text = f"{classification_text} {group.text[:300]}".strip()
        
        section_type = classify_text(model, tokenizer, classification_text)
        
        if section_type:
             # Normalize the BERT output using your mapping
             final_heading = SECTION_MERGE_MAP.get(section_type, section_type)
             group.heading = final_heading

        final_groups.append(group)

    return final_groups


# =============================================================================
# Remove Common Span Label Cleaner
# =============================================================================

def remove_common_span_label(groups: List[TextGroup]) -> List[TextGroup]:
    cleaned_groups = []

    for group in groups:
        valid_spans = []
        has_changes = False
        
        for span in group.spans:
            # 1. Check if the span is labeled as a header
            # 2. Check if the text actually matches a known common header
            if span.label == "section_header" and match_common_header(span.text):
                has_changes = True
                continue  # Skip this span (effectively deleting it)
            
            valid_spans.append(span)

        # Update the group only if changes occurred
        if has_changes:
            group.spans = valid_spans
            # CRITICAL: Rebuild the full text from remaining spans
            group.text = " ".join(s.text for s in valid_spans).strip()
        
        # Only keep the group if it still has text left
        if group.text:
            cleaned_groups.append(group)

    return cleaned_groups


# =============================================================================
# Merge TextGroups by Heading
# =============================================================================

def merge_text_groups(groups: List[TextGroup]) -> List[TextGroup]:
    merged_dict: Dict[str, TextGroup] = {}
    
    for group in groups:
        heading = group.heading
        
        if heading not in merged_dict:
            # First occurrence - create new merged group with copies of attributes
            merged_dict[heading] = TextGroup(
                heading=heading,
                text=group.text,
                spans=group.spans.copy()
            )
        else:
            # Merge with existing group
            existing = merged_dict[heading]
            
            # Concatenate text with space separator
            existing.text += " " + group.text
            
            # Extend spans list
            existing.spans.extend(group.spans)
    
    return list(merged_dict.values())
