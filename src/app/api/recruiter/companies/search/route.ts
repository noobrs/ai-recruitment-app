import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');

        if (!query || query.trim().length === 0) {
            return NextResponse.json([]);
        }

        const supabase = await createClient();

        // Search companies by name (case-insensitive)
        const { data, error } = await supabase
            .from('company')
            .select('*')
            .ilike('comp_name', `%${query}%`)
            .order('comp_name', { ascending: true })
            .limit(10);

        if (error) {
            console.error('Error searching companies:', error);
            return NextResponse.json(
                { error: 'Failed to search companies' },
                { status: 500 }
            );
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error('Company search error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
