// In AccountSettings.tsx
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image';
import EditableField from './EditableField';
import { PencilIcon } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { toast } from '@/app/hooks/use-toast';
import { useRouter } from 'next/navigation';

const AccountSettings = () => {
    const { data: session } = authClient.useSession();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [localImage, setLocalImage] = useState<string>('');
    const [dbImage, setDbImage] = useState<string>('');
    const [imageError, setImageError] = useState(false);
    const [userName, setUserName] = useState<string>('');
    const [userEmail, setUserEmail] = useState<string>('');
    const router = useRouter();

    useEffect(() => {
        fetchUserData();
    }, [session?.user.id, session?.user.image, session?.user.name, session?.user.email]); // Add all session dependencies

    const fetchUserData = async () => {
        if (!session?.user.id) return;

        try {
            // Add cache-busting for data refreshes
            const cacheParam = `?t=${new Date().getTime()}`;
            const response = await fetch(`/api/user?id=${session.user.id}`);
            if (!response.ok) throw new Error('Failed to fetch user data');

            const userData = await response.json();
            
            // Update all user data from the database
            if (userData.image) {
                setDbImage(`${userData.image}${cacheParam}`);
            }
            
            if (userData.name) {
                setUserName(userData.name);
            } else if (session?.user.name) {
                setUserName(session.user.name);
            }
            
            if (userData.email) {
                setUserEmail(userData.email);
            } else if (session?.user.email) {
                setUserEmail(session.user.email);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            // Fall back to session data if API fetch fails
            if (session?.user.name) setUserName(session.user.name);
            if (session?.user.email) setUserEmail(session.user.email);
            
            toast({
                title: "Error",
                description: "Failed to load user data",
            });
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const updateName = async (newName: string) => {
        if (!session) return;

        try {
            // Update in database first
            const response = await fetch(`/api/user?id=${session.user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newName }),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update name');
            }

            // Then update in session
            await authClient.updateUser({ name: newName });
            
            // Update local state
            setUserName(newName);
            
            // Force refresh to update all components
            router.refresh();
            
            toast({
                title: "Success",
                description: "Name updated successfully",
            });
        } catch (error) {
            console.error('Error updating name:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update name",
            });
        }
    };

    const updateEmail = async (newEmail: string) => {
        if (!session) return;

        try {
            // Use authClient to update email
            await authClient.changeEmail({ newEmail });
            
            // Update local state
            setUserEmail(newEmail);
            
            // Force refresh to update all components
            router.refresh();
            
            toast({
                title: "Success",
                description: "Email updated successfully",
            });
        } catch (error) {
            console.error('Error updating email:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update email",
            });
        }
    };

    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && session?.user.id) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalImage(reader.result as string);
            };
            reader.readAsDataURL(file);

            try {
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch(`/api/user/image?id=${session.user.id}`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to upload image');
                }

                const result = await response.json();
                const newImageUrl = result.imageUrl;

                // Update session with new image URL
                await authClient.updateUser({ image: newImageUrl });
                
                // Update local state
                setDbImage(`${newImageUrl}?t=${new Date().getTime()}`);
                setLocalImage('');
                
                // Refresh the router to ensure all components update
                router.refresh();

                toast({
                    title: "Success",
                    description: "Profile picture updated successfully",
                });
            } catch (error) {
                console.error('Error uploading profile picture:', error);
                setLocalImage('');
                toast({
                    title: "Error",
                    description: "Failed to update profile picture",
                });
            }
        }
    };

    // Use local state values first, then fall back to session values
    const displayName = userName || session?.user.name || '';
    const displayEmail = userEmail || session?.user.email || '';

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
            <div className="space-y-6 max-w-2xl">
                <div className="group relative">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Profile Picture
                    </label>
                    <div className="flex items-center gap-4">
                        <div
                            className="relative w-16 h-16 rounded-full overflow-hidden cursor-pointer"
                            onClick={handleImageClick}
                        >
                            <Image
                                src={localImage || session?.user.image || dbImage || '/default-profile.png'}
                                alt="Profile"
                                fill
                                className="object-cover"
                                onError={() => setImageError(true)}
                            />
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        <button
                            onClick={handleImageClick}
                            className="px-4 py-2 bg-gray-700/50 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Change Photo
                        </button>
                    </div>
                </div>

                <EditableField
                    label="Name"
                    value={displayName}
                    onSave={updateName}
                />
                <EditableField
                    label="Email"
                    value={displayEmail}
                    onSave={updateEmail}
                    requireConfirmation
                />

                <div className="group relative">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                        Password
                    </label>
                    <div className="flex justify-between items-center px-4 py-2 bg-gray-700/50 rounded-lg">
                        <span className="text-white/70 text-sm">••••••••</span>
                        <button
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-500 transition-colors text-sm"
                            onClick={() => {
                                toast({
                                    title: "Coming Soon",
                                    description: "Password change functionality is under construction.",
                                });
                            }}
                        >
                            <PencilIcon className="h-4 w-4" />
                            Change
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountSettings;