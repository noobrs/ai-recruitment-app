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
    file_bytes: bytes
) -> Dict[str, Any]:
    """
    Upload a redacted resume PDF to Supabase storage bucket 'resumes-redacted'
    and generate a long-lived signed URL.

    Args:
        file_bytes: The PDF file bytes to upload
        job_seeker_id: Optional job seeker ID for folder organization

    Returns:
        {
            "status": "success" | "error",
            "file_path": str | None,  # The storage path
            "signed_url": str | None,  # The long-lived signed URL
            "message": str | None
        }
    """
    try:
        # Generate unique filepath
        file_path = f"anonymous/{uuid.uuid4()}.pdf"

        # Upload to Supabase storage with custom filename in Content-Disposition
        response = supabase.storage.from_("resumes-redacted").upload(
            path=file_path,
            file=file_bytes,
            file_options={
                "content-type": "application/pdf",
                "upsert": "false",
                "content-disposition": 'inline; filename="redacted-resume.pdf"'
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
