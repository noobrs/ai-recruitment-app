'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Cropper, { Area } from 'react-easy-crop';
import { X } from 'lucide-react';

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedImageBlob: Blob, croppedImageUrl: string) => void;
    onCancel: () => void;
}

export default function ImageCropperModal({
    imageSrc,
    onCropComplete,
    onCancel,
}: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- Modal plumbing ---
    const [mounted, setMounted] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const lastFocusedEl = useRef<HTMLElement | null>(null);

    useEffect(() => {
        setMounted(true);

        // save & move focus into modal
        lastFocusedEl.current = (document.activeElement as HTMLElement) ?? null;
        // lock page scroll
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // focus first focusable (close button later)
        const to = setTimeout(() => {
            const first = modalRef.current?.querySelector<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            first?.focus();
        }, 0);

        return () => {
            clearTimeout(to);
            document.body.style.overflow = prevOverflow;
            // restore focus
            lastFocusedEl.current?.focus();
        };
    }, []);

    // trap focus inside modal
    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.stopPropagation();
            onCancel();
        }
        if (e.key === 'Tab' && modalRef.current) {
            const focusables = Array.from(
                modalRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                )
            ).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
            if (focusables.length === 0) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                last.focus();
                e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === last) {
                first.focus();
                e.preventDefault();
            }
        }
    };

    // --- your cropper logic ---
    const onCropChange = useCallback((location: { x: number; y: number }) => {
        setCrop(location);
    }, []);

    const onZoomChange = useCallback((z: number) => setZoom(z), []);

    const handleCropComplete = useCallback((_area: Area, areaPx: Area) => {
        setCroppedAreaPixels(areaPx);
    }, []);

    const createCroppedImage = async (src: string, pixelCrop: Area) => {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
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

        return new Promise<{ blob: Blob; url: string }>((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Canvas is empty'));
                const url = URL.createObjectURL(blob);
                resolve({ blob, url });
            }, 'image/jpeg', 0.95);
        });
    };

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const { blob, url } = await createCroppedImage(imageSrc, croppedAreaPixels);
            onCropComplete(blob, url);
        } catch (err) {
            console.error(err);
            alert('Failed to crop image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const content = (
        <div
            className="fixed inset-0 z-9999 flex items-center justify-center"
            aria-modal="true"
            role="dialog"
            aria-labelledby="cropper-title"
            onKeyDown={onKeyDown}
        >
            {/* overlay */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={isProcessing ? undefined : onCancel}
                aria-hidden="true"
            />
            {/* modal */}
            <div
                ref={modalRef}
                className="relative w-full h-full max-w-4xl max-h-[90vh] mx-4 sm:mx-auto p-4 flex flex-col bg-neutral-900 rounded-2xl shadow-2xl ring-1 ring-white/10"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-4 text-white">
                    <h2 id="cropper-title" className="text-2xl font-semibold">Crop Your Photo</h2>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
                        disabled={isProcessing}
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Cropper Area */}
                <div className="relative flex-1 bg-black rounded-xl overflow-hidden">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={handleCropComplete}
                        showGrid
                        cropShape="round"
                        style={{ containerStyle: { backgroundColor: '#000' } }}
                    />
                </div>

                {/* Controls */}
                <div className="mt-4 space-y-4 bg-neutral-800 p-4 rounded-xl text-white/90">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium min-w-[60px]">Zoom:</label>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="flex-1 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-primary"
                            disabled={isProcessing}
                            aria-label="Zoom"
                        />
                        <span className="text-sm min-w-[45px] text-right">{Math.round(zoom * 100)}%</span>
                    </div>

                    <div className="text-sm text-white/70 space-y-1">
                        <p>• Drag the image to reposition</p>
                        <p>• Use the slider to zoom in/out</p>
                        <p>• The grid helps with alignment and composition</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={onCancel}
                            disabled={isProcessing}
                            className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-md transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isProcessing || !croppedAreaPixels}
                            className="px-6 py-2 bg-primary hover:bg-primary/80 rounded-md transition-colors disabled:opacity-50"
                        >
                            {isProcessing ? 'Processing...' : 'Save & Apply'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render above everything via portal
    if (!mounted) return null;
    return createPortal(content, document.body);
}
