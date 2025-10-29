# Supabase Realtime Setup for Resume Processing

This guide explains how to configure Supabase Realtime to enable instant notifications when resume processing is complete.

## What Changed

**Before:** The frontend polled `/api/resumes/{id}` every 3 seconds to check if processing was complete.

**After:** The frontend subscribes to database changes via Supabase Realtime and gets instant notifications when the `resume` table is updated.

---

## Supabase Dashboard Configuration

### Step 1: Enable Realtime for the `resume` Table

1. **Go to Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID

2. **Open Database → Replication**
   - In the left sidebar, click **Database**
   - Click on **Replication** tab

3. **Enable Realtime for `resume` table**
   - Find the `resume` table in the list
   - Toggle the switch to **enable** Realtime replication
   - Click **Save** or confirm the change

   **Screenshot location:** Look for a section titled "Realtime" or "Publication"

   The `resume` table should now appear in the list of replicated tables.

---

### Step 2: Verify RLS Policies (Already Done)

Your existing RLS (Row Level Security) policies should already allow job seekers to read their own resumes. Verify this:

1. **Go to Authentication → Policies**
2. **Check the `resume` table policies**
3. **Ensure there's a SELECT policy** that looks like:

```sql
CREATE POLICY "Users can view their own resumes"
ON resume
FOR SELECT
USING (
  job_seeker_id IN (
    SELECT job_seeker_id 
    FROM job_seeker 
    WHERE user_id = auth.uid()
  )
);
```

If this policy doesn't exist, create it in **SQL Editor**:

```sql
-- Enable RLS on resume table (if not already enabled)
ALTER TABLE resume ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT (read) operations
CREATE POLICY "Users can view their own resumes"
ON resume
FOR SELECT
USING (
  job_seeker_id IN (
    SELECT job_seeker_id 
    FROM job_seeker 
    WHERE user_id = auth.uid()
  )
);
```

---

### Step 3: Test Realtime Connection (Optional)

You can test if Realtime is working using the Supabase SQL Editor:

1. **Open SQL Editor**
2. **Run this query to simulate an update:**

```sql
-- First, find a test resume
SELECT resume_id, job_seeker_id, redacted_file_path 
FROM resume 
LIMIT 1;

-- Then update it (replace 123 with actual resume_id)
UPDATE resume 
SET redacted_file_path = 'resumes-redacted/test/123.pdf',
    updated_at = NOW()
WHERE resume_id = 123;
```

3. **Open your app** with the resume upload dialog
4. **Check browser console** for Realtime messages:
   - Should see: `Realtime subscription status: SUBSCRIBED`
   - After update: `Resume update received: {payload}`

---

## How It Works Now

### Frontend Flow

```
1. User uploads resume
2. Frontend receives resumeId from /api/resumes/upload
3. Frontend subscribes to Realtime channel: resume-{resumeId}
4. FastAPI processes resume in background
5. FastAPI sends webhook to Next.js
6. Next.js updates resume table with redacted_file_path
7. Supabase Realtime pushes UPDATE event to frontend
8. Frontend instantly shows "Resume processed successfully"
```

### Code Changes

**UploadResumeAction.tsx:**
- ❌ Removed: `setInterval` polling every 3 seconds
- ✅ Added: Supabase Realtime subscription
- ✅ Added: Fallback check after 30 seconds (in case Realtime fails)

### Realtime Subscription

```typescript
supabase
  .channel(`resume-${resumeId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'resume',
      filter: `resume_id=eq.${resumeId}`,
    },
    (payload) => {
      // Triggered when resume is updated
      if (payload.new.redacted_file_path) {
        setProgress('finished');
      }
    }
  )
  .subscribe();
```

---

## Benefits

✅ **Instant Updates** - No 3-second delay  
✅ **Efficient** - No constant HTTP requests  
✅ **Battery Friendly** - Fewer network operations  
✅ **Scalable** - Server pushes updates only when needed  
✅ **Fallback Safe** - Falls back to single check after 30s if Realtime fails  

---

## Troubleshooting

### Issue: "Realtime subscription status: CHANNEL_ERROR"

**Solution:**
- Verify Realtime is enabled for `resume` table in Database → Replication
- Check if RLS policies allow SELECT on `resume` table
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

### Issue: Updates not received in real-time

**Solution:**
- Check browser console for subscription status
- Verify the `resume_id` filter is correct
- Test by manually updating the resume in SQL Editor
- Ensure WebSocket connections are not blocked by firewall/proxy

### Issue: "SUBSCRIBED" but no updates

**Solution:**
- Check if the webhook is actually updating the database
- Verify the `redacted_file_path` field is being set
- Check backend logs for webhook errors
- Manually trigger webhook to test

---

## Testing Checklist

- [ ] Realtime enabled for `resume` table in Supabase Dashboard
- [ ] RLS policies allow SELECT on `resume` table
- [ ] Upload a resume via the UI
- [ ] Check browser console shows: `Realtime subscription status: SUBSCRIBED`
- [ ] Wait for FastAPI to process (should see instant update, no 3s delay)
- [ ] Verify "Resume processed successfully" appears immediately
- [ ] Test with slow/failing FastAPI (should fallback after 30s)

---

## Rollback (If Needed)

If you need to revert to polling:

1. Restore the old `UploadResumeAction.tsx` from git history
2. Change won't affect anything else - backend remains the same

---

## Next Steps (Optional Improvements)

1. **Add connection status indicator** - Show user if Realtime is connected
2. **Retry logic** - Automatically reconnect if subscription fails
3. **Progress updates** - Stream processing progress (e.g., "Extracting text...", "Redacting...")
4. **Multiple resumes** - Subscribe to all user's resumes, not just one

---

## Environment Variables Required

No new environment variables needed! Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Summary

The refactoring is complete. You just need to:

1. **Enable Realtime** for the `resume` table in Supabase Dashboard
2. **Verify RLS policies** allow users to read their own resumes
3. **Test** by uploading a resume

That's it! No code changes needed on FastAPI side.
