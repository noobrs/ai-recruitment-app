# API Routing Structure

## URL Patterns

This document explains how API routes are organized in this application.

### Next.js API Routes: `/api/*`

All Next.js API routes use the `/api/*` prefix:

```
✅ /api/auth/signout          → Next.js API route (Server-side sign out)
✅ /api/auth/*                → Future Next.js auth endpoints
✅ /api/[anything-else]/*     → Available for Next.js routes
```

**Location:** `src/app/api/*/route.ts`

**Purpose:**
- Server-side operations within Next.js
- Authentication endpoints
- Middleware-like operations
- Next.js specific features (revalidation, etc.)

### FastAPI Routes: `/api/py/*`

All FastAPI routes use the `/api/py/*` prefix:

```
✅ /api/py/health             → FastAPI health check
✅ /api/py/test-supabase      → FastAPI Supabase connection test
✅ /api/py/[future-endpoints] → All future FastAPI endpoints
```

**Location:** `api/index.py` (Python)

**Purpose:**
- Python-based AI/ML operations
- Data processing
- Complex backend logic
- Integration with Python libraries

### Documentation Routes

```
✅ /docs                      → FastAPI Swagger UI (auto-generated docs)
✅ /openapi.json              → FastAPI OpenAPI schema
```

---

## How Routing Works

### Development Mode

When running locally (`npm run dev`):

1. **Next.js runs on:** `http://localhost:3000`
2. **FastAPI runs on:** `http://localhost:8000` (separate process)

**Request Flow:**
```
Browser → http://localhost:3000/api/py/health
   ↓
Next.js rewrites to → http://127.0.0.1:8000/api/health
   ↓
FastAPI processes → Returns response
```

### Production Mode

When deployed to Vercel:

1. **Next.js:** Deployed as main app
2. **FastAPI:** Deployed as serverless function via Mangum

**Request Flow:**
```
Browser → https://yourdomain.com/api/py/health
   ↓
Next.js rewrites to → /api/ (serverless function)
   ↓
Vercel runs FastAPI → Returns response
```

---

## Configuration

### `next.config.ts`

```typescript
rewrites: async () => {
  return [
    {
      // Forward /api/py/* to FastAPI
      source: "/api/py/:path*",
      destination: process.env.NODE_ENV === "development"
        ? "http://127.0.0.1:8000/api/:path*"  // Local FastAPI
        : "/api/",                              // Serverless FastAPI
    }
  ];
}
```

**Key Points:**
- Only `/api/py/*` gets forwarded to FastAPI
- `/api/*` (without `/py`) stays in Next.js
- This prevents conflicts between Next.js and FastAPI routes

---

## Why This Separation?

### 1. **Clear Boundaries**
```
/api/*     → Next.js (TypeScript, React ecosystem)
/api/py/*  → FastAPI (Python, AI/ML ecosystem)
```

### 2. **No Conflicts**
- Next.js routes won't accidentally get sent to FastAPI
- Each framework owns its namespace

### 3. **Easy to Understand**
- `/py/` clearly indicates "this is Python/FastAPI"
- Developers immediately know which backend handles the request

### 4. **Future-Proof**
- Can add more Next.js API routes without worry
- Can expand FastAPI endpoints independently

---

## Adding New Endpoints

### Adding a Next.js API Route

**File:** `src/app/api/users/route.ts`
```typescript
export async function GET() {
  return Response.json({ users: [] })
}
```

**Access via:** `http://localhost:3000/api/users`

### Adding a FastAPI Route

**File:** `api/index.py`
```python
@app.get("/api/analyze")
async def analyze():
    return {"result": "analysis complete"}
```

**Access via:** `http://localhost:3000/api/py/analyze`

---

## Common Patterns

### Calling FastAPI from Frontend

```typescript
// Client Component
const response = await fetch('/api/py/health')
const data = await response.json()
```

### Calling FastAPI from Next.js Server

```typescript
// Server Component or API Route
const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/py/health`)
const data = await response.json()
```

### Calling Next.js API from Frontend

```typescript
// Client Component
const response = await fetch('/api/auth/signout', { method: 'POST' })
```

---

## Troubleshooting

### "404 Not Found" on FastAPI Routes

**Problem:** Accessing `/api/health` instead of `/api/py/health`

**Solution:** Use `/api/py/*` prefix for all FastAPI endpoints

### "Route conflicts" errors

**Problem:** Both Next.js and FastAPI have same route pattern

**Solution:** 
- Next.js routes: `/api/*` (no `/py`)
- FastAPI routes: `/api/py/*` (with `/py`)

### FastAPI not responding in development

**Problem:** FastAPI server not running

**Solution:** Start FastAPI separately:
```bash
python -m uvicorn api.index:app --reload --port 8000
```

---

## Summary

| Route Pattern | Handled By | Example |
|--------------|------------|---------|
| `/api/*` (no `/py`) | Next.js | `/api/auth/signout` |
| `/api/py/*` | FastAPI | `/api/py/health` |
| `/docs` | FastAPI | Swagger UI |
| `/openapi.json` | FastAPI | OpenAPI schema |

**Remember:** Always use `/api/py/*` when calling FastAPI endpoints!
