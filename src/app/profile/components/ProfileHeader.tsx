'use client';

import React, { useRef } from 'react';
import { CameraIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { toast } from '@/app/hooks/use-toast';
import { authClient } from '@/lib/auth-client';

interface ProfileHeaderProps {
    profileImage: string;
    name: string;
    bio: string;
    userId: string | null;
    setProfileImage: (img: string) => void;
    fetchUserData: (forceRefresh?: boolean) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    profileImage,
    name,
    bio,
    userId,
    setProfileImage,
    fetchUserData,
}) => {
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && userId) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);

            try {
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch(`/api/user/image?id=${userId}`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                });

                if (!response.ok) throw new Error('Failed to upload image');
                const result = await response.json();

                await authClient.updateUser({ image: result.imageUrl });
                fetchUserData(true);

                toast({
                    title: 'Success',
                    description: 'Profile picture updated successfully',
                });
            } catch (error) {
                console.error('Error uploading profile picture:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to update profile picture',
                });
            }
        }
    };

    return (
        <header className="mb-8 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
                <div className="flex items-center mb-4 md:mb-0">
                    <div className="relative w-20 h-20 md:w-24 md:h-24 group mr-4">
                        <div
                            className="relative w-full h-full rounded-full overflow-hidden cursor-pointer
                                        group-hover:ring-4 group-hover:ring-blue-500/50 transition-all"
                            onClick={handleImageClick}
                        >
                            {imageError ? (
                                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                    <CameraIcon className="h-8 w-8 text-gray-400" />
                                </div>
                            ) : (
                                <Image
                                    src={profileImage}
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                    onError={() => setImageError(true)}
                                />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                                        transition-opacity flex items-center justify-center">
                                <CameraIcon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                    <div>
                        <div className="flex items-center">
                            <h1 className="text-3xl font-bold text-white">
                                {name}
                            </h1>
                            {icon && <span className="ml-2">{icon}</span>}
                        </div>
                        <p className="text-gray-400">{email}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                        <p className="text-gray-400 text-sm">Balance</p>
                        <p className="text-xl font-bold text-white">
                            ${balance.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-400 text-sm">Portfolio Value</p>
                        <p className="text-xl font-bold text-white">
                            ${portfolioValue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default ProfileHeader;
