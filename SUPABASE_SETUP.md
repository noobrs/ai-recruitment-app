# Supabase Setup Guide

## ✅ Installation Complete!

I've set up Supabase for both Next.js and FastAPI. Here's what was added:

### Files Created:
1. **`src/lib/supabase.ts`** - Supabase client for Next.js (client-side)
2. **`api/supabase_client.py`** - Supabase client for FastAPI (server-side)
3. **`src/components/SupabaseTest.tsx`** - Example component to test Supabase
4. **`.env.example`** - Template for environment variables

### Environment Variables:
Your `.env.local` already has:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous/public key

---

## 🚀 Next Steps:

### 1. Create a Table in Supabase

Go to your Supabase dashboard: https://app.supabase.com/project/aonvheabwhbqguoiuowb

Create a test table (e.g., `users` or `posts`):

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert some test data
INSERT INTO users (name, email) VALUES 
  ('John Doe', 'john@example.com'),
  ('Jane Smith', 'jane@example.com');
```

### 2. Update Table Names in Code

Replace `'your_table_name'` with your actual table name:

- In `api/index.py` (line 19)
- In `src/components/SupabaseTest.tsx` (line 19)

### 3. Test the Connection

Start your dev servers:
```bash
# Terminal 1 - FastAPI
npm run fastapi-dev

# Terminal 2 - Next.js
npm run dev
```

Visit http://localhost:3000 and:
- Click "Test Supabase Connection" button
- Visit http://localhost:8000/api/test-supabase to test FastAPI connection

---

## 📚 How to Use Supabase

### In Next.js Components:

```typescript
import { supabase } from '@/lib/supabase'

// Fetch data
const { data, error } = await supabase
  .from('users')
  .select('*')

// Insert data
const { data, error } = await supabase
  .from('users')
  .insert({ name: 'New User', email: 'user@example.com' })

// Update data
const { data, error } = await supabase
  .from('users')
  .update({ name: 'Updated Name' })
  .eq('id', 1)

// Delete data
const { data, error } = await supabase
  .from('users')
  .delete()
  .eq('id', 1)
```

### In FastAPI:

```python
from api.supabase_client import supabase

# Fetch data
response = supabase.table('users').select('*').execute()

# Insert data
response = supabase.table('users').insert({
    'name': 'New User',
    'email': 'user@example.com'
}).execute()

# Update data
response = supabase.table('users').update({
    'name': 'Updated Name'
}).eq('id', 1).execute()

# Delete data
response = supabase.table('users').delete().eq('id', 1).execute()
```

---

## 🔐 Security Tips:

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use Row Level Security (RLS)** in Supabase for production
3. **For server-side operations**, get the service role key:
   - Go to: https://app.supabase.com/project/aonvheabwhbqguoiuowb/settings/api
   - Add to `.env.local`: `SUPABASE_KEY=your_service_role_key`
   - Use this for admin operations in FastAPI

---

## 📖 Learn More:

- [Supabase Docs](https://supabase.com/docs)
- [Supabase + Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase + Python](https://supabase.com/docs/reference/python/introduction)
