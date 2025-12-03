"use client";

import { useState } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
    onSearch: (query: string, location: string) => void;
    queryPlaceholder?: string;
    locationPlaceholder?: string;
}

export default function SearchBar({
    onSearch,
    queryPlaceholder = "Job title or company name",
    locationPlaceholder = "Location",
}: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [location, setLocation] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query.trim(), location.trim());
    };

    const handleClear = () => {
        setQuery("");
        setLocation("");
        onSearch("", "");
    };

    return (
        <form
            onSubmit={handleSearch}
            className="flex items-center gap-0 bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-shadow duration-200 px-6 py-3 max-w-3xl mx-auto mb-8"
        >
            {/* Query Input */}
            <div className="flex-1 flex items-center gap-2 border-r border-gray-300 pr-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={queryPlaceholder}
                    className="w-full outline-none text-gray-700 placeholder-gray-400"
                />
            </div>

            {/* Location Input */}
            <div className="flex-1 flex items-center gap-2 px-4">
                <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
                <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={locationPlaceholder}
                    className="w-full outline-none text-gray-700 placeholder-gray-400"
                />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                {(query || location) && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors duration-150"
                    >
                        Clear
                    </button>
                )}
                <button
                    type="submit"
                    disabled={!query.trim() && !location.trim()}
                    className="bg-primary text-white px-2 py-2 rounded-full hover:bg-primary/90 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Search className="w-5 h-5 text-black" />
                </button>
            </div>
        </form>
    );
}
