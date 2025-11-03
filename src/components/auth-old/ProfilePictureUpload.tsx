'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProfilePictureUploadProps {
    currentImageUrl?: string;
    onImageSelect?: (file: File) => void;
    disabled?: boolean;
}

export default function ProfilePictureUpload({ 
    currentImageUrl, 
    onImageSelect,
    disabled = false 
}: ProfilePictureUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleFile = (file: File) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Callback for parent component
        onImageSelect?.(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        onImageSelect?.(null as unknown as File);
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                Profile Picture
                <span className="text-gray-500 font-normal ml-1">(Optional)</span>
            </label>

            <div className="flex items-center gap-4">
                {/* Preview */}
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                    {preview ? (
                        <Image
                            src={preview}
                            alt="Profile preview"
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Upload area */}
                <div className="flex-1">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                            border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                            transition-colors duration-200
                            ${isDragging 
                                ? 'border-indigo-500 bg-indigo-50' 
                                : 'border-gray-300 hover:border-indigo-400'
                            }
                            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <input
                            type="file"
                            id="profilePicture"
                            name="profilePicture"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={disabled}
                            className="hidden"
                        />
                        <label
                            htmlFor="profilePicture"
                            className={`cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`}
                        >
                            <div className="flex flex-col items-center gap-1">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <div className="text-sm">
                                    <span className="text-indigo-600 font-medium">Upload a photo</span>
                                    <span className="text-gray-500"> or drag and drop</span>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                            </div>
                        </label>
                    </div>

                    {preview && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            disabled={disabled}
                            className="mt-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                            Remove photo
                        </button>
                    )}
                </div>
            </div>

            <p className="text-xs text-gray-500">
                {/* Placeholder for storage implementation notice */}
                Note: Profile picture upload will be enabled once storage is configured
            </p>
        </div>
    );
}
