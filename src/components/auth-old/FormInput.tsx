import { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
    label: string;
    name: string;
    error?: string;
    helperText?: string;
    isTextarea?: boolean;
    rows?: number;
}

export default function FormInput({ 
    label, 
    name, 
    error, 
    helperText,
    isTextarea = false,
    rows = 4,
    required,
    className = '',
    ...props 
}: FormInputProps) {
    const baseInputClasses = `
        block w-full px-3 py-2 border rounded-lg shadow-sm 
        placeholder-gray-400 focus:outline-none 
        transition-colors duration-200
        ${error 
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
        }
        ${props.disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
        ${className}
    `.trim();

    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {isTextarea ? (
                <textarea
                    id={name}
                    name={name}
                    rows={rows}
                    className={baseInputClasses}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
                    {...(props as InputHTMLAttributes<HTMLTextAreaElement>)}
                />
            ) : (
                <input
                    id={name}
                    name={name}
                    className={baseInputClasses}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
                    {...(props as InputHTMLAttributes<HTMLInputElement>)}
                />
            )}

            {error && (
                <p id={`${name}-error`} className="mt-1 text-xs text-red-600">
                    {error}
                </p>
            )}
            
            {!error && helperText && (
                <p id={`${name}-helper`} className="mt-1 text-xs text-gray-500">
                    {helperText}
                </p>
            )}
        </div>
    );
}
