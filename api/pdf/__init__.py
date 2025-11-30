"""
Refactored PDF resume extraction pipeline.

Key improvements over the old pipeline:
1. Removed unused bias detection code
2. Replaced hardcoded keyword matching with ML-based section classification
3. Better separation of concerns with focused modules
4. Cleaner, more maintainable codebase

Main entry point:
    from api.pdf_new import process_resume

    result = process_resume(pdf_bytes)
"""

from api.pdf.pipeline import process_pdf_resume

__all__ = ["process_pdf_resume"]
