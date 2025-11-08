'use client';

import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X } from 'lucide-react';

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedImageBlob: Blob, croppedImageUrl: string) => void;
    onCancel: () => void;
}

/**
 * ImageCropper Component
 * 
 * Provides an interactive cropping interface with:
 * - 9-grid (3×3) overlay for better composition
 * - Zoom controls
 * - Pan/reposition capability
 * - Square aspect ratio for consistent profile pictures
 */
export default function ImageCropper({
    imageSrc,
    onCropComplete,
    onCancel,
}: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    /**
     * Callback when crop area changes
     */
    const onCropChange = useCallback((location: { x: number; y: number }) => {
        setCrop(location);
    }, []);

    /**
     * Callback when zoom changes
     */
    const onZoomChange = useCallback((zoom: number) => {
        setZoom(zoom);
    }, []);

    /**
     * Callback when crop is complete (stores the pixel coordinates)
     */
    const handleCropComplete = useCallback(
        (_croppedArea: Area, croppedAreaPixels: Area) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    /**
     * Creates a cropped image from the original image
     */
    const createCroppedImage = async (
        imageSrc: string,
        pixelCrop: Area
    ): Promise<{ blob: Blob; url: string }> => {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.addEventListener('load', () => resolve(img));
            img.addEventListener('error', (error) => reject(error));
            img.src = imageSrc;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        // Set canvas size to the cropped area size
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        // Draw the cropped image
        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        // Convert canvas to blob
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                const url = URL.createObjectURL(blob);
                resolve({ blob, url });
            }, 'image/jpeg', 0.95);
        });
    };

    /**
     * Handles the save action
     */
    const handleSave = async () => {
        if (!croppedAreaPixels) return;

        setIsProcessing(true);

        try {
            const { blob, url } = await createCroppedImage(imageSrc, croppedAreaPixels);
            onCropComplete(blob, url);
        } catch (error) {
            console.error('Error cropping image:', error);
            alert('Failed to crop image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
            <div className="relative w-full h-full max-w-4xl max-h-[90vh] mx-auto p-4 flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 text-white">
                    <h2 className="text-2xl font-bold">Crop Your Photo</h2>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        disabled={isProcessing}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Cropper Area */}
                <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={handleCropComplete}
                        showGrid={true}
                        cropShape="round"
                        style={{
                            containerStyle: {
                                backgroundColor: '#000',
                            },
                        }}
                    />
                </div>

                {/* Controls */}
                <div className="mt-4 space-y-4 bg-gray-900 p-4 rounded-lg">
                    {/* Zoom Slider */}
                    <div className="flex items-center gap-4">
                        <label className="text-white text-sm font-medium min-w-[60px]">
                            Zoom:
                        </label>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            disabled={isProcessing}
                        />
                        <span className="text-white text-sm min-w-[45px] text-right">
                            {Math.round(zoom * 100)}%
                        </span>
                    </div>

                    {/* Instructions */}
                    <div className="text-gray-400 text-sm space-y-1">
                        <p>• Drag the image to reposition</p>
                        <p>• Use the slider to zoom in/out</p>
                        <p>• The grid helps with alignment and composition</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={onCancel}
                            disabled={isProcessing}
                            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isProcessing || !croppedAreaPixels}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'Processing...' : 'Save & Apply'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
