from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .supabase_client import supabase

app = FastAPI(docs_url="/api/py/docs")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/py/health")
def health():
    return {"ok": True, "service": "fastapi"}

@app.get("/api/py/test-supabase")
async def test_supabase():
    """Test Supabase connection by listing tables"""
    try:
        # This will fail if no tables exist, but shows connection works
        # Replace 'your_table_name' with an actual table name from your database
        response = supabase.table('users').select("*").limit(1).execute()
        return {
            "status": "connected",
            "message": "Supabase connection successful",
            "data": response.data
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "hint": "Make sure you have created a table in Supabase or update the table name"
        }

