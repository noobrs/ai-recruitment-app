'use client';

import { useState, useEffect, useRef } from 'react';
import { Building2, Check, Loader2, X } from 'lucide-react';
import { Company } from '@/types';

interface CompanyAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onCompanySelect: (company: Company | null) => void;
    selectedCompany: Company | null;
    disabled?: boolean;
    required?: boolean;
}

export default function CompanyAutocomplete({
    value,
    onChange,
    onCompanySelect,
    selectedCompany,
    disabled = false,
    required = false,
}: CompanyAutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce search
    useEffect(() => {
        if (!value || value.trim().length < 2) {
            setCompanies([]);
            setIsOpen(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            searchCompanies(value);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchCompanies = async (query: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/recruiter/companies/search?q=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error('Failed to search companies');
            }

            const data = await response.json();
            setCompanies(data);
            setIsOpen(data.length > 0);
        } catch (err) {
            console.error('Error searching companies:', err);
            setError('Failed to search companies');
            setCompanies([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        
        // If user is typing and had selected a company, clear the selection
        if (selectedCompany) {
            onCompanySelect(null);
        }
    };

    const handleSelectCompany = (company: Company) => {
        onChange(company.comp_name);
        onCompanySelect(company);
        setIsOpen(false);
    };

    const handleClearSelection = () => {
        onChange('');
        onCompanySelect(null);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    disabled={disabled}
                    required={required}
                    placeholder="Type to search or add new company..."
                    className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-10 py-2 outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                    autoComplete="off"
                />
                
                {/* Loading or Clear button */}
                {isLoading && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 text-neutral-400 animate-spin" />
                )}
                {!isLoading && value && !disabled && (
                    <button
                        type="button"
                        onClick={handleClearSelection}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Selected company indicator */}
            {selectedCompany && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    <span>Joining existing company: <strong>{selectedCompany.comp_name}</strong></span>
                </div>
            )}

            {/* Dropdown */}
            {isOpen && companies.length > 0 && !disabled && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="py-1">
                        {companies.map((company) => (
                            <button
                                key={company.company_id}
                                type="button"
                                onClick={() => handleSelectCompany(company)}
                                className="w-full px-4 py-2 text-left hover:bg-neutral-50 flex items-start gap-3 transition-colors"
                            >
                                <Building2 className="h-5 w-5 text-neutral-400 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-neutral-900">{company.comp_name}</div>
                                    {(company.comp_industry || company.comp_location) && (
                                        <div className="text-sm text-neutral-500 truncate">
                                            {[company.comp_industry, company.comp_location]
                                                .filter(Boolean)
                                                .join(' • ')}
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="mt-1 text-sm text-red-500">{error}</div>
            )}

            {/* Help text */}
            {!selectedCompany && value.trim().length > 0 && !isLoading && companies.length === 0 && isOpen === false && (
                <div className="mt-1 text-sm text-neutral-500">
                    No matches found. You can add a new company with this name.
                </div>
            )}
        </div>
    );
}
