import { NextResponse } from 'next/server';

/**
 * Next.js API Route Test
 * This demonstrates a Next.js API route (not FastAPI)
 * Access at: /api/test/nextjs
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || 'World';

    return NextResponse.json({
        message: `Hello, ${name}!`,
        timestamp: new Date().toISOString(),
        server: 'Next.js API Route',
        environment: process.env.NODE_ENV,
        route: '/api/test/nextjs',
    });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        return NextResponse.json({
            message: 'POST request received',
            receivedData: body,
            timestamp: new Date().toISOString(),
            server: 'Next.js API Route',
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: 'Invalid JSON body',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 400 }
        );
    }
}
