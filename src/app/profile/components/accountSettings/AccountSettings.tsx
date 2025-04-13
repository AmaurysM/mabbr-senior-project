"use client";

import Image from 'next/image';
import { Lock, Eye, EyeOff, PencilIcon } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { toast } from '@/app/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useEffect, useRef, useState } from 'react';
import EditableField from './EditableSettingFields';

export const ResetPasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, { message: "Current password is required" }),
    newPassword: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .max(20, { message: "Password must be at most 20 characters long" }),
    confirmPassword: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .max(20, { message: "Password must be at most 20 characters long" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

const AccountSettings = () => {
    const { data: session } = authClient.useSession();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [localImage, setLocalImage] = useState<string>('');
    const [dbImage, setDbImage] = useState<string>('');
    const [imageError, setImageError] = useState(false);
    const [userName, setUserName] = useState<string>('');
    const [userEmail, setUserEmail] = useState<string>('');
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [validationErrors, setValidationErrors] = useState<string | null>(null);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    useEffect(() => {
        const fetchUserData = async () => {
            if (!session?.user.id) return;
            try {
                const cacheParam = `?t=${new Date().getTime()}`;
                const response = await fetch(`/api/user?id=${session.user.id}`);
                if (!response.ok) throw new Error('Failed to fetch user data');

                const userData = await response.json();

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
                if (session?.user.name) setUserName(session.user.name);
                if (session?.user.email) setUserEmail(session.user.email);
                toast({
                    title: "Error",
                    description: "Failed to load user data",
                });
            }
        };
        fetchUserData();
    }, [session?.user.id, session?.user.image, session?.user.name, session?.user.email]);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const updateName = async (newName: string) => {
        if (!session) return;

        try {
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

            await authClient.updateUser({ name: newName });
            setUserName(newName);
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
            await authClient.changeEmail({ newEmail });
            setUserEmail(newEmail);
            window.location.reload();
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

                await authClient.updateUser({ image: newImageUrl });
                setDbImage(`${newImageUrl}?t=${new Date().getTime()}`);
                setLocalImage('');
                window.location.reload();
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

    // Reset the password fields and any validation errors
    const resetPasswordState = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setValidationErrors(null);
        setShowPasswordForm(false);
    };

    const updatePassword = async () => {
        const formData = {
            currentPassword,
            newPassword,
            confirmPassword
        };

        const validation = ResetPasswordSchema.safeParse(formData);
        if (!validation.success) {
            setValidationErrors(validation.error.errors[0].message);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                }),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update password');
            }

            toast({
                title: "Success",
                description: "Password updated successfully",
            });

            resetPasswordState();
        } catch (error) {
            console.error('Error updating password:', error);
            setValidationErrors(error instanceof Error ? error.message : "Failed to update password");

            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update password",
            });
        } finally {
            setLoading(false);
        }
    };

    const displayName = userName || session?.user.name || '';
    const displayEmail = userEmail || session?.user.email || '';

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
            <div className="space-y-6 max-w-2xl">
                {/* Profile Picture Section - Updated Design */}
                <div className="group relative">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Profile Picture
                    </label>
                    <div className="bg-gradient-to-r from-gray-700/80 to-gray-800/80 rounded-lg border border-gray-600/30 shadow-md p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className="relative w-16 h-16 rounded-full overflow-hidden cursor-pointer border-2 border-blue-500/30 shadow-md hover:shadow-blue-500/40 transition-all duration-300"
                                onClick={handleImageClick}
                            >
                                <Image
                                    src={localImage || session?.user.image || dbImage || '/default-profile.png'}
                                    alt="Profile"
                                    fill
                                    sizes="64px" // Fixed the missing sizes prop
                                    className="object-cover"
                                    onError={() => setImageError(true)}
                                />
                            </div>
                            <div>
                                <div className="text-white font-medium">Profile Photo</div>
                                <div className="text-gray-400 text-sm">Update your profile picture</div>
                            </div>
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
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md shadow-md hover:shadow-blue-500/30 transition-all"
                        >
                            Change Photo
                        </button>
                    </div>
                </div>

                {/* Name and Email sections now use the improved EditableField component */}
                <EditableField label="Name" value={displayName} onSave={updateName} />
                <EditableField label="Email" value={displayEmail} onSave={updateEmail} requireConfirmation />

                {/* Password Section - Updated Design */}
                <div className="group relative">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                        Password
                    </label>
                    {!showPasswordForm ? (
                        <div className="bg-gradient-to-r from-gray-700/80 to-gray-800/80 rounded-lg border border-gray-600/30 shadow-md hover:shadow-blue-500/20 transition-all duration-300">
                            <button
                                className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
                                onClick={() => setShowPasswordForm(true)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500/20 p-2 rounded-full">
                                        <Lock className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">Change Password</div>
                                        <div className="text-gray-400 text-sm">Update your security credentials</div>
                                    </div>
                                </div>
                                <div className="bg-blue-600/80 hover:bg-blue-500 p-2 rounded-md transition-colors">
                                    <PencilIcon className="h-4 w-4 text-white" />
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3 p-5 bg-gray-700/80 rounded-lg border border-gray-600/50 shadow-lg">
                            <div className="relative">
                                <label className="block text-sm text-gray-300 mb-1">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-2 pr-10 bg-gray-800/90 text-white rounded-md border border-gray-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-sm text-gray-300 mb-1">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2 pr-10 bg-gray-800/90 text-white rounded-md border border-gray-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword((prev) => !prev)}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-sm text-gray-300 mb-1">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2 pr-10 bg-gray-800/90 text-white rounded-md border border-gray-600/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {validationErrors && (
                                <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded border border-red-500/20">
                                    {validationErrors}
                                </p>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={updatePassword}
                                    disabled={loading}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md shadow-md hover:shadow-blue-500/30 transition-all flex-1 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                                <button
                                    onClick={resetPasswordState}
                                    className="px-5 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountSettings;