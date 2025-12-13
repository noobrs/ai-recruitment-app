"""
Section classification using BERT fine-tuned on resume sections.
Classifies resume text into section types: education, experience, skills, etc.
"""

import re
from collections import defaultdict
from typing import Dict, List, Optional, Tuple

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from api.types.types import TextGroup
from api.pdf.config import COMMON_SECTION_HEADERS, SECTION_CLASSIFIER_MODEL, SECTION_MERGE_MAP


# =============================================================================
# Model Singleton
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
    groups_needing_bert: List[TextGroup] = []
    
    print(f"[SectionClassifier] Classifying {len(groups)} heading groups...")
    
    # First pass: Filter NO_HEADING and Try fast-path header matching
    for group in groups:
        if group.heading == "NO_HEADING":
            # Process the group to filter spans
            group = process_no_heading(group)
            
            if not group:
                continue  # Skip adding this group to final_groups
            
            # If group remains, add to final list
            final_groups.append(group)
            continue 

        else:
            # Add to final list immediately, we are just updating the heading in place
            final_groups.append(group)

            # Try fast-path matching against common headers
            matched_section = match_common_header(group.heading)
            if matched_section:
                print(f"[SectionClassifier] '{group.heading}' -> {matched_section} (fast-match)")
                group.heading = matched_section
                continue
        
        # Queue for BERT classification if it wasn't a fast match
        groups_needing_bert.append(group)

    # Second pass: Use NER to classify sections (placeholder)

    # Third pass: Use BERT only for unmatched headings
    if groups_needing_bert:
        model, tokenizer = load_section_classifier()
        
        for group in groups_needing_bert:
            classification_text = group.heading
            if group.text:
                classification_text = f"{classification_text} {group.text[:300]}".strip()
            
            section_type = classify_text(model, tokenizer, classification_text)
            print(f"[SectionClassifier] '{group.heading}' -> {section_type} (BERT)")
            
            if section_type:
                 group.heading = SECTION_MERGE_MAP.get(section_type, section_type)
    
    return final_groups


# =============================================================================
# Remove Common Span Label Cleaner
# =============================================================================

def remove_common_span_label(groups: List[TextGroup]) -> List[TextGroup]:
    """
    Iterates through groups and removes spans that are labeled as 'section_header'
    AND match a common header keyword.
    
    Reconstructs group.text afterwards to ensure clean content.
    """
    cleaned_groups = []
    
    print(f"[Cleaner] Checking {len(groups)} groups for redundant internal headers...")

    for group in groups:
        valid_spans = []
        has_changes = False
        
        for span in group.spans:
            # 1. Check if the span is labeled as a header
            # 2. Check if the text actually matches a known common header
            if span.label == "section_header" and match_common_header(span.text):
                print(f"   -> Removing span: '{span.text}' (Matched Common Header)")
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
        else:
            print(f"   -> Dropping group '{group.heading}' (became empty after cleaning)")

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
                spans=group.spans.copy(),
                # entities=group.entities.copy() if group.entities else None
            )
        else:
            # Merge with existing group
            existing = merged_dict[heading]
            
            # Concatenate text with space separator
            existing.text += " " + group.text
            
            # Extend spans list
            existing.spans.extend(group.spans)
            
            # # Merge entities
            # if group.entities:
            #     if existing.entities is None:
            #         existing.entities = []
            #     existing.entities.extend(group.entities)
    
    return list(merged_dict.values())
