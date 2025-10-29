import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

let cachedAdminClient: SupabaseClient<Database> | null = null;

/**
 * Create (or reuse) a Supabase client authenticated with the service role key.
 * This should only be used in trusted server contexts.
 */
export function createAdminClient() {
    if (cachedAdminClient) {
        return cachedAdminClient;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) {
        throw new Error('Environment variable NEXT_PUBLIC_SUPABASE_URL is not set.');
    }

    if (!serviceKey) {
        throw new Error('Environment variable SUPABASE_SERVICE_ROLE_KEY is not set.');
    }

    cachedAdminClient = createClient<Database>(url, serviceKey, {
        auth: {
            persistSession: false,
        },
    });

    return cachedAdminClient;
}
