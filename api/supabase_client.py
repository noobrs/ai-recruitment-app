import os
import uuid
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Dict, Any

# Load environment variables from .env.local
env_path = Path(__file__).parent.parent / '.env.local'
load_dotenv(dotenv_path=env_path)

# Get Supabase credentials
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Validate credentials
if not url:
    raise ValueError("NEXT_PUBLIC_SUPABASE_URL is not set in environment variables")
if not key:
    raise ValueError("Supabase key is not set in environment variables")

# Create Supabase client
supabase: Client = create_client(url, key)


def upload_redacted_resume_to_storage(
    file_bytes: bytes,
    file_type: str = "pdf"
) -> Dict[str, Any]:
    """
    Upload a redacted resume file to Supabase storage bucket 'resumes-redacted'
    and generate a long-lived signed URL.

    Args:
        file_bytes: The file bytes to upload (PDF or image)
        file_type: File type - either "pdf" or "jpg"/"jpeg"/"png" (default: "pdf")

    Returns:
        {
            "status": "success" | "error",
            "file_path": str | None,  # The storage path
            "signed_url": str | None,  # The long-lived signed URL
            "message": str | None
        }
    """
    try:
        # Normalize file type
        file_type = file_type.lower()
        
        # Determine content type and file extension
        content_type_map = {
            "pdf": ("application/pdf", "pdf", "redacted-resume.pdf"),
            "jpg": ("image/jpeg", "jpg", "redacted-resume.jpg"),
            "jpeg": ("image/jpeg", "jpg", "redacted-resume.jpg"),
            "png": ("image/png", "png", "redacted-resume.png"),
        }
        
        if file_type not in content_type_map:
            return {
                "status": "error",
                "file_path": None,
                "signed_url": None,
                "message": f"Unsupported file type: {file_type}. Supported types: pdf, jpg, jpeg, png"
            }
        
        content_type, extension, display_filename = content_type_map[file_type]
        
        # Generate unique filepath
        file_path = f"anonymous/{uuid.uuid4()}.{extension}"

        # Upload to Supabase storage with custom filename in Content-Disposition
        response = supabase.storage.from_("resumes-redacted").upload(
            path=file_path,
            file=file_bytes,
            file_options={
                "content-type": content_type,
                "upsert": "false",
                "content-disposition": f'inline; filename="{display_filename}"'
            }
        )

        # Check if upload was successful
        if hasattr(response, 'error') and response.error:
            return {
                "status": "error",
                "file_path": None,
                "signed_url": None,
                "message": f"Upload failed: {response.error}"
            }

        # Generate long-lived signed URL (10 years)
        signed_url_response = supabase.storage.from_("resumes-redacted").create_signed_url(
            path=file_path,
            expires_in=315360000  # 10 years in seconds
        )

        signed_url = signed_url_response.get("signedURL")
        if not signed_url:
            return {
                "status": "error",
                "file_path": file_path,
                "signed_url": None,
                "message": "Failed to generate signed URL"
            }

        return {
            "status": "success",
            "file_path": file_path,
            "signed_url": signed_url,
            "message": None
        }

    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error uploading redacted resume: {str(e)}")
        return {
            "status": "error",
            "file_path": None,
            "signed_url": None,
            "message": str(e)
        }
