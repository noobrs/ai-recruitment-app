'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import { deleteProfilePictureAction } from '@/app/actions/profile-picture.actions';
import {
    ALLOWED_FILE_TYPES,
    validateProfilePicture
} from '@/constants/profile-picture.constants';
import toast from 'react-hot-toast';
import ImageCropper from './ImageCropper';

interface ProfilePictureUploadProps {
    currentPicturePath?: string;
    previewUrl: string | null;
    initials: string;
    isEditing: boolean;
    onFileChange: (file: File | null, previewUrl: string | null) => void;
}

/**
 * ProfilePictureUpload Component
 * 
 * Handles profile picture upload with interactive cropping.
 * Only clickable when isEditing is true.
 * Shows cropping modal after file selection.
 */
export default function ProfilePictureUpload({
    currentPicturePath,
    previewUrl,
    initials,
    isEditing,
    onFileChange,
}: ProfilePictureUploadProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [originalFileName, setOriginalFileName] = useState<string>('');

    /**
     * Handles file input change with validation
     * Opens cropping interface instead of immediately setting preview
     */
    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const validationError = validateProfilePicture(file);
            if (validationError) {
                toast.error(validationError);
                return;
            }

            // Store original filename for later
            setOriginalFileName(file.name);

            // Create preview URL for cropping
            const objectUrl = URL.createObjectURL(file);
            setImageToCrop(objectUrl);
        },
        []
    );

    /**
     * Handles successful crop completion
     */
    const handleCropComplete = useCallback(
        (croppedBlob: Blob, croppedUrl: string) => {
            // Convert blob to File with original filename
            const croppedFile = new File(
                [croppedBlob],
                originalFileName || 'profile-picture.jpg',
                { type: 'image/jpeg' }
            );

            // Clean up the temporary crop image
            if (imageToCrop) {
                URL.revokeObjectURL(imageToCrop);
            }

            setImageToCrop(null);
            onFileChange(croppedFile, croppedUrl);
        },
        [imageToCrop, originalFileName, onFileChange]
    );

    /**
     * Handles crop cancellation
     */
    const handleCropCancel = useCallback(() => {
        if (imageToCrop) {
            URL.revokeObjectURL(imageToCrop);
        }
        setImageToCrop(null);
        setOriginalFileName('');
    }, [imageToCrop]);

    /**
     * Handles profile picture deletion
     */
    const handleDelete = useCallback(async () => {
        if (!currentPicturePath) return;

        if (!confirm('Are you sure you want to delete your profile picture?')) {
            return;
        }

        setIsDeleting(true);

        try {
            const result = await deleteProfilePictureAction();

            if (result.error) {
                throw new Error(result.error);
            }

            toast.success('Profile picture deleted successfully!');
            onFileChange(null, null);
            router.refresh();
        } catch (err) {
            console.error('Profile picture deletion failed:', err);
            toast.error(err instanceof Error ? err.message : 'Delete failed. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    }, [currentPicturePath, onFileChange, router]);

    const displayImageUrl = previewUrl || currentPicturePath;

    return (
        <>
            <div className="relative w-[120px] h-[120px] group">
                {displayImageUrl ? (
                    <Image
                        src={displayImageUrl}
                        alt="Profile"
                        width={120}
                        height={120}
                        className="rounded-full object-cover border-4 border-gray-100"
                    />
                ) : (
                    <div className="w-[120px] h-[120px] rounded-full bg-gray-600 from-primary to-secondary flex items-center justify-center border-4 border-gray-100">
                        <span className="text-4xl font-bold text-white">{initials}</span>
                    </div>
                )}

                {isEditing && (
                    <>
                        {/* Upload overlay */}
                        <label className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                            <Camera className="h-8 w-8 text-white mb-1" />
                            <span className="text-xs text-white font-medium">Change Photo</span>
                            <input
                                type="file"
                                accept={ALLOWED_FILE_TYPES.join(',')}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>

                        {/* Delete button - only show if there's a current picture */}
                        {currentPicturePath && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="absolute -bottom-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                                title="Delete profile picture"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Image Cropper Modal */}
            {imageToCrop && (
                <ImageCropper
                    imageSrc={imageToCrop}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCropCancel}
                />
            )}
        </>
    );
}
