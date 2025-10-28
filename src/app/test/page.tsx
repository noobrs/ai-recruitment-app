'use client';

import { useState } from 'react';
import Link from 'next/link';

type ApiResponse = {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
    duration?: number;
};

export default function TestPage() {
    const [nextjsResult, setNextjsResult] = useState<ApiResponse | null>(null);
    const [fastapiResult, setFastapiResult] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState<{ nextjs: boolean; fastapi: boolean }>({
        nextjs: false,
        fastapi: false,
    });

    const testNextJsApi = async () => {
        setLoading((prev) => ({ ...prev, nextjs: true }));
        const startTime = performance.now();

        try {
            const response = await fetch('/api/test/nextjs?name=Tester');
            const data = await response.json();
            const duration = performance.now() - startTime;

            setNextjsResult({
                success: true,
                data,
                duration: Math.round(duration),
            });
        } catch (error) {
            const duration = performance.now() - startTime;
            setNextjsResult({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Math.round(duration),
            });
        } finally {
            setLoading((prev) => ({ ...prev, nextjs: false }));
        }
    };

    const testFastApi = async () => {
        setLoading((prev) => ({ ...prev, fastapi: true }));
        const startTime = performance.now();

        try {
            const response = await fetch('/api/py/health');
            const data = await response.json();
            const duration = performance.now() - startTime;

            setFastapiResult({
                success: true,
                data,
                duration: Math.round(duration),
            });
        } catch (error) {
            const duration = performance.now() - startTime;
            setFastapiResult({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Math.round(duration),
            });
        } finally {
            setLoading((prev) => ({ ...prev, fastapi: false }));
        }
    };

    const testBothApis = () => {
        testNextJsApi();
        testFastApi();
    };

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">API Testing Dashboard</h1>
                <p className="text-gray-600 mb-8">Test both Next.js and FastAPI endpoints</p>

                {/* Test Buttons */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={testNextJsApi}
                        disabled={loading.nextjs}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {loading.nextjs ? 'Testing...' : 'Test Next.js API'}
                    </button>
                    <button
                        onClick={testFastApi}
                        disabled={loading.fastapi}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {loading.fastapi ? 'Testing...' : 'Test FastAPI'}
                    </button>
                    <button
                        onClick={testBothApis}
                        disabled={loading.nextjs || loading.fastapi}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        Test Both
                    </button>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Next.js API Result */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Next.js API</h2>
                            <span className="text-sm text-gray-500">/api/test/nextjs</span>
                        </div>

                        {nextjsResult ? (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span
                                        className={`w-3 h-3 rounded-full ${nextjsResult.success ? 'bg-green-500' : 'bg-red-500'
                                            }`}
                                    ></span>
                                    <span className="font-medium">
                                        {nextjsResult.success ? 'Success' : 'Failed'}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        ({nextjsResult.duration}ms)
                                    </span>
                                </div>

                                <div className="bg-gray-50 rounded p-3 overflow-auto max-h-64">
                                    <pre className="text-xs text-gray-700">
                                        {JSON.stringify(
                                            nextjsResult.success ? nextjsResult.data : nextjsResult.error,
                                            null,
                                            2
                                        )}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-400 text-center py-8">
                                Click &quot;Test Next.js API&quot; to run test
                            </div>
                        )}
                    </div>

                    {/* FastAPI Result */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">FastAPI</h2>
                            <span className="text-sm text-gray-500">/api/py/health</span>
                        </div>

                        {fastapiResult ? (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span
                                        className={`w-3 h-3 rounded-full ${fastapiResult.success ? 'bg-green-500' : 'bg-red-500'
                                            }`}
                                    ></span>
                                    <span className="font-medium">
                                        {fastapiResult.success ? 'Success' : 'Failed'}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        ({fastapiResult.duration}ms)
                                    </span>
                                </div>

                                <div className="bg-gray-50 rounded p-3 overflow-auto max-h-64">
                                    <pre className="text-xs text-gray-700">
                                        {JSON.stringify(
                                            fastapiResult.success ? fastapiResult.data : fastapiResult.error,
                                            null,
                                            2
                                        )}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-400 text-center py-8">
                                Click &quot;Test FastAPI&quot; to run test
                            </div>
                        )}
                    </div>
                </div>

                {/* API Documentation */}
                <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">API Endpoints</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">Next.js Routes</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono mr-2">
                                        GET
                                    </span>
                                    <span className="font-mono">/api/test/nextjs?name=YourName</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono mr-2">
                                        POST
                                    </span>
                                    <span className="font-mono">/api/test/nextjs</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-mono mr-2">
                                        POST
                                    </span>
                                    <span className="font-mono">/api/auth/signout</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">FastAPI Routes</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono mr-2">
                                        GET
                                    </span>
                                    <span className="font-mono">/api/py/health</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono mr-2">
                                        GET
                                    </span>
                                    <span className="font-mono">/api/py/test-supabase</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-mono mr-2">
                                        DOCS
                                    </span>
                                    <a href="/docs" target="_blank" className="font-mono text-blue-600 hover:underline">
                                        /docs (Swagger UI)
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="mt-8 flex gap-4">
                    <a
                        href="/docs"
                        target="_blank"
                        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                    >
                        Open FastAPI Docs
                    </a>
                    <Link
                        href="/"
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        </main>
    );
}

