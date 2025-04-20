"use client";
import { authClient } from '@/lib/auth-client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';

const Banner = () => {
    const { data: session } = authClient.useSession();
    const [banner, setBanner] = useState<string | null>(null);
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [bannerError, setBannerError] = useState<boolean>(false);
    const [showCropper, setShowCropper] = useState<boolean>(false);
    const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState<number>(1);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cropperRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const isDragging = useRef<boolean>(false);
    const modalRef = useRef<HTMLDivElement>(null);

    const dragStart = useRef({ x: 0, y: 0 });


    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                handleCancelCrop();
            }
        };
        if (showCropper) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showCropper]);


    // Process banner URL with timestamp to force refresh
    const bannerWithTimestamp = useMemo(() => {
        if (!banner) return null;
        return `${banner}?t=${new Date().getTime()}`;
    }, [banner]);

    const handleImageClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
                setShowCropper(true);
                setZoom(1);
                setCropPosition({ x: 0, y: 0 });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
                setShowCropper(true);
                setZoom(1);
                setCropPosition({ x: 0, y: 0 });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
        if (imageRef.current) {
            isDragging.current = true;
            dragStart.current = {
                x: e.clientX - cropPosition.x,
                y: e.clientY - cropPosition.y
            };
            // Prevent default drag behavior
            e.preventDefault();
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging.current && cropperRef.current && imageDimensions) {
            const cropperRect = cropperRef.current.getBoundingClientRect();
            const cropperWidth = cropperRect.width;
            const cropperHeight = cropperRect.height;

            // Calculate the scaled image dimensions
            const scaledWidth = imageDimensions.width * zoom;
            const scaledHeight = imageDimensions.height * zoom;

            // Calculate constraints to keep the image within view
            // The minimum values ensure that the right/bottom edges don't go beyond the cropper
            const minX = -Math.max(0, scaledWidth - cropperWidth);
            const minY = -Math.max(0, scaledHeight - cropperHeight);
            // The maximum values (0) ensure that the left/top edges don't go beyond the cropper
            const maxX = 0;
            const maxY = 0;

            // Calculate new position
            let newX = e.clientX - dragStart.current.x;
            let newY = e.clientY - dragStart.current.y;

            // Apply constraints
            newX = Math.max(minX, Math.min(maxX, newX));
            newY = Math.max(minY, Math.min(maxY, newY));

            setCropPosition({ x: newX, y: newY });
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();

        // Determine zoom direction
        const zoomDirection = e.deltaY < 0 ? 1 : -1;
        const zoomFactor = 0.1; // Adjust this value to control zoom speed

        // Calculate new zoom level
        const newZoom = Math.max(1, Math.min(3, zoom + zoomDirection * zoomFactor));

        if (newZoom !== zoom && cropperRef.current && imageRef.current && imageDimensions) {
            const cropperRect = cropperRef.current.getBoundingClientRect();

            const mouseX = e.clientX - cropperRect.left;
            const mouseY = e.clientY - cropperRect.top;

            const imageX = mouseX - cropPosition.x;
            const imageY = mouseY - cropPosition.y;

            const scaleChange = newZoom / zoom;
            const newPosX = mouseX - imageX * scaleChange;
            const newPosY = mouseY - imageY * scaleChange;

            const scaledWidth = imageDimensions.width * newZoom;
            const scaledHeight = imageDimensions.height * newZoom;
            const minX = -Math.max(0, scaledWidth - cropperRect.width);
            const minY = -Math.max(0, scaledHeight - cropperRect.height);

            const constrainedX = Math.max(minX, Math.min(0, newPosX));
            const constrainedY = Math.max(minY, Math.min(0, newPosY));

            setZoom(newZoom);
            setCropPosition({ x: constrainedX, y: constrainedY });
        }
    }, [cropPosition, imageDimensions, zoom]);

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = parseFloat(e.target.value);

        if (cropperRef.current && imageDimensions) {
            const cropperRect = cropperRef.current.getBoundingClientRect();
            const cropperWidth = cropperRect.width;
            const cropperHeight = cropperRect.height;

            const scaledWidth = imageDimensions.width * newZoom;
            const scaledHeight = imageDimensions.height * newZoom;

            const centerX = cropPosition.x + (scaledWidth / zoom - scaledWidth / newZoom) / 2;
            const centerY = cropPosition.y + (scaledHeight / zoom - scaledHeight / newZoom) / 2;

            const minX = -Math.max(0, scaledWidth - cropperWidth);
            const minY = -Math.max(0, scaledHeight - cropperHeight);
            const maxX = 0;
            const maxY = 0;

            const newX = Math.max(minX, Math.min(maxX, centerX));
            const newY = Math.max(minY, Math.min(maxY, centerY));

            setZoom(newZoom);
            setCropPosition({ x: newX, y: newY });
        } else {
            setZoom(newZoom);
        }
    };

    const handleCancelCrop = () => {
        setShowCropper(false);
        setImage(null);
        setImagePreview(null);
        setCropPosition({ x: 0, y: 0 });
        setZoom(1);
        setImageDimensions(null);
    };

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        setImageDimensions({
            width: img.naturalWidth,
            height: img.naturalHeight
        });

        if (cropperRef.current) {
            const cropperRect = cropperRef.current.getBoundingClientRect();
            const cropperWidth = cropperRect.width;
            const cropperHeight = cropperRect.height;

            const centerX = (cropperWidth - img.naturalWidth) / 2;
            const centerY = (cropperHeight - img.naturalHeight) / 2;

            setCropPosition({
                x: Math.min(0, centerX),
                y: Math.min(0, centerY)
            });
        }
    };
    const router = useRouter();
    const handleSaveCrop = async () => {
        if (!cropperRef.current || !imageRef.current) return;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) return;

        // Get the actual dimensions of the cropper element
        const cropperRect = cropperRef.current.getBoundingClientRect();

        // Set canvas to match the cropper dimensions
        canvas.width = cropperRect.width;
        canvas.height = cropperRect.height;

        if (imageRef.current.complete && imageDimensions) {
            // Calculate the source area to crop from the original image
            const sourceX = -cropPosition.x / zoom;
            const sourceY = -cropPosition.y / zoom;
            const sourceWidth = cropperRect.width / zoom;
            const sourceHeight = cropperRect.height / zoom;

            // Draw the cropped image onto the canvas
            context.drawImage(
                imageRef.current,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                0,
                0,
                canvas.width,
                canvas.height
            );

            // Convert canvas to blob
            canvas.toBlob(async (blob) => {
                if (blob) {
                    const croppedFile = new File([blob], "cropped-banner.jpg", { type: "image/jpeg" });
                    setImage(croppedFile);
                    try {
                        await updateImage(croppedFile);
                        router.refresh();
                        setShowCropper(false);
                        setImageDimensions(null);
                    } catch (error) {
                        console.error("Error saving cropped image:", error);
                        setError("Failed to save cropped image");
                    }
                }
            }, 'image/jpeg', 0.92);
        }
    };

    const updateImage = async (imageToUpload: File = image as File) => {
        try {
            setError(null);
            const formData = new FormData();
            if (imageToUpload) {
                formData.append("image", imageToUpload);
            } else {
                console.error("No image selected to upload.");
                setError("No image selected");
                return;
            }

            console.log("Uploading banner image...");
            const response = await fetch(`/api/user/banner/update`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Failed to submit image:", errorText);
                setError(`Failed to update banner: ${response.status} ${errorText}`);
                return;
            }

            const result = await response.json();
            console.log("Banner update response:", result);

            // Refresh the banner after successful update
            getBanner();

            setImage(null);
            setImagePreview(null);
        } catch (e) {
            console.error("Error updating banner:", e);
            setError("Error updating banner image");
        }
    };

    const getBanner = async () => {
        try {
            setBannerError(false);
            console.log("Fetching banner...");
            const response = await fetch(`/api/user/banner`, {
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });

            if (!response.ok) {
                console.error("Failed to fetch banner:", response.status);
                setBannerError(true);
                return;
            }

            const json = await response.json();
            console.log("Banner API response:", json.banner);
            setBanner(json.banner);
            setBannerError(false);

        } catch (e) {
            console.error("Error fetching banner:", e);
            setBannerError(true);
        }
    };
    useEffect(() => {
        const currentRef = cropperRef.current;
        if (currentRef && showCropper) {
            currentRef.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            if (currentRef) {
                currentRef.removeEventListener('wheel', handleWheel);
            }
        };
    }, [handleWheel, showCropper]);

    useEffect(() => {
        if (session) {
            getBanner();
        }
    }, [session]);

    // Reset banner error when banner changes
    useEffect(() => {
        if (banner) {
            setBannerError(false);
        }
    }, [banner]);

    // Check if banner is a valid URL string
    const isValidUrl = banner && typeof banner === 'string' && banner.trim() !== '' && (
        banner.trim().startsWith('http://') ||
        banner.trim().startsWith('https://') ||
        banner.trim().startsWith('/') ||
        banner.trim().startsWith('data:image/')
    );

    return (
        <div className="group relative">
            <label className="block text-sm font-medium text-gray-400 mb-2">
                Profile Banner
            </label>
            <div className="bg-gradient-to-r from-gray-700/80 to-gray-800/80 rounded-lg border border-gray-600/30 shadow-md p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {isValidUrl && !bannerError ? (
                        <div className="h-16 w-40 rounded overflow-hidden relative">
                            <Image
                                src={bannerWithTimestamp || ''}
                                alt="Profile banner"
                                fill
                                sizes="160px"
                                className="object-cover"
                                onError={() => {
                                    console.error("Failed to load banner thumbnail:", bannerWithTimestamp);
                                    setBannerError(true);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="h-16 w-40 rounded bg-gray-600 flex items-center justify-center">
                            <span className="text-xs text-gray-300">No banner</span>
                        </div>
                    )}
                    <div>
                        <div className="text-white font-medium">Profile Banner</div>
                        <div className="text-gray-400 text-sm">Update your profile banner</div>
                    </div>
                </div>

                <button
                    onClick={handleImageClick}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md shadow-md hover:shadow-blue-500/30 transition-all"
                >
                    Change Banner
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
            </div>

            {/* Image Cropper Dialog */}
            {showCropper && imagePreview && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                    <div ref={modalRef} className="  bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">
                            Crop Banner Image
                        </h3>

                        <div
                            ref={cropperRef}
                            className="relative w-full  aspect-[700/256] overflow-hidden mb-4 border-2 border-blue-600"
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <div
                                className="absolute top-0 left-0"
                                style={{
                                    transform: `translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${zoom})`,
                                    transformOrigin: 'top left',
                                    cursor: 'grab',
                                }}
                                onMouseDown={handleMouseDown}
                            >
                                <Image
                                    ref={imageRef}
                                    src={imagePreview}
                                    alt="Preview"
                                    width={imageDimensions?.width || 400}
                                    height={imageDimensions?.height || 256}
                                    draggable={false}
                                    onLoad={handleImageLoad}
                                    unoptimized
                                />
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-gray-400 text-center bg-black bg-opacity-50 p-2 rounded">
                                    <p>Drag to position • Scroll to zoom • Use slider for precise zoom</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label
                                htmlFor="zoom"
                                className="block text-sm font-medium text-gray-400 mb-2"
                            >
                                Zoom: {zoom.toFixed(1)}x
                            </label>
                            <input
                                id="zoom"
                                type="range"
                                min="1"
                                max="3"
                                step="0.1"
                                value={zoom}
                                onChange={handleZoomChange}
                                className="w-full bg-gray-700 rounded-full appearance-none h-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={handleCancelCrop}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-md"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveCrop}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-2 text-red-500 text-sm">{error}</div>
            )}
        </div>
    );
};

export default Banner;