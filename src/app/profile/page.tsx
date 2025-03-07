'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon, CameraIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { authClient } from "@/lib/auth-client";
import { toast } from '@/app/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Achievement, UserAchievement } from '@prisma/client';

interface Transaction {
    id: string;
    type: string;
    stockSymbol: string;
    quantity: number;
    price: number;
    timestamp: string;
}

interface EditableFieldProps {
    value: string;
    label: string;
    onSave: (value: string) => Promise<void>;
    requireConfirmation?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({ value, label, onSave, requireConfirmation = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newValue, setNewValue] = useState(value);
    const [confirmValue, setConfirmValue] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setNewValue(value);
    }, [value]);

    const handleSave = async () => {
        if (requireConfirmation && newValue !== confirmValue) {
            setError('Values do not match');
            return;
        }

        try {
            setIsSaving(true);
            await onSave(newValue);
            setIsEditing(false);
            setError('');
            toast({
                title: "Success",
                description: `${label} updated successfully`,
            });
        } catch (error) {
            console.error(`Error updating ${label}:`, error);
            setError(`Failed to update ${label}`);
            toast({
                title: "Error",
                description: `Failed to update ${label}`,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setNewValue(value);
        setConfirmValue('');
        setError('');
    };

    return (
        <div className="group relative">
            <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-400">{label}</label>
                <button
                    onClick={() => setIsEditing(true)}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <PencilIcon className="h-4 w-4 text-blue-400 hover:text-blue-500" />
                </button>
            </div>

            {!isEditing ? (
                <p className="text-white">{value}</p>
            ) : (
                <div className="space-y-2 mt-2">
                    <input
                        type="text"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700/30 rounded-lg border border-white/5
                     focus:border-blue-500/50 focus:outline-none transition-colors text-white"
                    />
                    {requireConfirmation && (
                        <input
                            type="text"
                            value={confirmValue}
                            onChange={(e) => setConfirmValue(e.target.value)}
                            placeholder={`Confirm ${label.toLowerCase()}`}
                            className="w-full px-3 py-2 bg-gray-700/30 rounded-lg border border-white/5
                       focus:border-blue-500/50 focus:outline-none transition-colors text-white"
                        />
                    )}
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <div className="flex space-x-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <CheckIcon className="h-4 w-4" />
                            )}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProfilePage = () => {
    const router = useRouter();
    const [profileImage, setProfileImage] = useState<string>('/default-profile.png');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [bio, setBio] = useState('No bio yet.');
    const [balance, setBalance] = useState<number>(0);
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [newBio, setNewBio] = useState(bio);
    const [loading, setLoading] = useState(true);
    const [isSavingBio, setIsSavingBio] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Achievement stuff
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [achievementsLoading, setAchievementsLoading] = useState(true);
    const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
    const [UserAchievementsLoading, setUserAchievementsLoading] = useState(true);

    // New state for transactions
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    // Helper function to format timestamps to relative time
    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.error(`Invalid date received: ${dateString}`);
            return "Invalid date";
        }
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const seconds = Math.floor(diff / 1000);
        if (seconds < 60) return `${seconds} seconds ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minutes ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
        const years = Math.floor(days / 365);
        return `${years} year${years === 1 ? '' : 's'} ago`;
    };

    // Fetch recent transactions
    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/user/transactions');
            const data = await res.json();
            if (data.success) {
                setTransactions(data.transactions);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    useEffect(() => {
        setAchievementsLoading(true);
        const fetchAchievements = async () => {
            try {
                const response = await fetch('/api/achievements');
                if (!response.ok) throw new Error('Failed to fetch achievements');
                const data = await response.json();
                setAchievements(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setAchievementsLoading(false);
            }
        };

        fetchAchievements();
    }, []);

    useEffect(() => {
        setUserAchievementsLoading(true);
        const fetchUserAchievements = async () => {
            try {
                const response = await fetch('/api/user/achievements');
                if (!response.ok) {
                    if (response.status === 401) throw new Error('Unauthorized: Please log in.');
                    throw new Error('Failed to fetch user achievements.');
                }
                const data = await response.json();
                setUserAchievements(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchUserAchievements();
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const { data: session } = await authClient.getSession();

                if (session?.user) {
                    setName(session.user.name || '');
                    setEmail(session.user.email || '');
                    setUserId(session.user.id || null);

                    if (session.user.id) {
                        try {
                            const response = await fetch(`/api/user/${session.user.id}`, {
                                credentials: 'include'
                            });
                            if (response.ok) {
                                const userData = await response.json();
                                if (userData.name) {
                                    setName(userData.name);
                                }
                                if (userData.email) {
                                    setEmail(userData.email);
                                }
                                if (userData.bio) {
                                    setBio(userData.bio);
                                    setNewBio(userData.bio);
                                }
                                if (userData.image) {
                                    setProfileImage(userData.image);
                                }
                                if (userData.balance !== undefined) {
                                    setBalance(userData.balance);
                                }
                            } else {
                                console.error('Failed to fetch user data:', await response.text());
                            }
                        } catch (error) {
                            console.error('Error fetching additional user data:', error);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

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

                const response = await fetch(`/api/user/${userId}/image`, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to upload image');
                }

                toast({
                    title: "Success",
                    description: "Profile picture updated successfully",
                });
            } catch (error) {
                console.error('Error uploading profile picture:', error);
                toast({
                    title: "Error",
                    description: "Failed to update profile picture",
                });
            }
        }
    };

    const updateName = async (newName: string) => {
        if (!userId) return;

        const response = await fetch(`/api/user/${userId}`, {
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

        setName(newName);

        try {
            await authClient.updateUser({
                name: newName,
            });
            router.refresh();
        } catch (error) {
            console.error('Error updating session:', error);
        }
    };

    const updateEmail = async (newEmail: string) => {
        if (!userId) return;

        try {
            const response = await fetch(`/api/user/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: newEmail }),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update email');
            }

            setEmail(newEmail);
            toast({
                title: "Success",
                description: "Email updated successfully",
            });

            try {
                await authClient.changeEmail({
                    newEmail: newEmail,
                    callbackURL: "/login-signup",
                });
                window.location.href = '/profile';
            } catch (error) {
                console.error('Error updating session:', error);
                toast({
                    title: "Warning",
                    description: "Email updated in database but session update failed. You may need to log out and back in to see changes.",
                });
            }
        } catch (error) {
            console.error('Error updating email:', error);
            toast({
                title: "Error",
                description: "Failed to update email",
            });
        }
    };

    const updateBio = async () => {
        if (!userId) return;

        try {
            setIsSavingBio(true);

            const response = await fetch(`/api/user/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ bio: newBio }),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update bio');
            }

            setBio(newBio);
            setIsEditingBio(false);

            toast({
                title: "Success",
                description: "Bio updated successfully",
            });
        } catch (error) {
            console.error('Error updating bio:', error);
            toast({
                title: "Error",
                description: "Failed to update bio",
            });
        } finally {
            setIsSavingBio(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-center">
                <div className="text-white">Loading profile...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-r from-gray-900 to-gray-800 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4 group">
                        <div
                            className="relative w-full h-full rounded-full overflow-hidden cursor-pointer
                       group-hover:ring-4 group-hover:ring-blue-500/50 transition-all"
                            onClick={handleImageClick}
                        >
                            {imageError ? (
                                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                    <CameraIcon className="h-12 w-12 text-gray-400" />
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
                                <CameraIcon className="h-8 w-8 text-white" />
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
                    <h1 className="text-5xl font-extrabold text-white mb-4">Your Profile</h1>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Profile Information */}
                    <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>
                        <div className="space-y-6">
                            <EditableField
                                label="Name"
                                value={name}
                                onSave={updateName}
                            />
                            <EditableField
                                label="Email"
                                value={email}
                                onSave={updateEmail}
                                requireConfirmation
                            />

                            {/* Bio Field */}
                            <div className="space-y-2 group">
                                <div className="flex items-center">
                                    <label className="block text-sm font-medium text-gray-400">Bio</label>
                                    <button
                                        onClick={() => {
                                            setIsEditingBio(true);
                                            setNewBio(bio);
                                        }}
                                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <PencilIcon className="h-4 w-4 text-blue-400 hover:text-blue-500" />
                                    </button>
                                </div>
                                {!isEditingBio ? (
                                    <p className="text-white whitespace-pre-wrap">{bio}</p>
                                ) : (
                                    <div className="space-y-2">
                                        <textarea
                                            value={newBio}
                                            onChange={(e) => setNewBio(e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-700/30 rounded-lg border border-white/5
                               focus:border-blue-500/50 focus:outline-none transition-colors text-white"
                                            rows={4}
                                        />
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={updateBio}
                                                disabled={isSavingBio}
                                                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
                                            >
                                                {isSavingBio ? (
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                ) : (
                                                    <CheckIcon className="h-4 w-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingBio(false);
                                                    setNewBio(bio);
                                                }}
                                                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                                            >
                                                <XMarkIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Statistics */}
                    <section className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4">Trading Statistics</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-400">Total Trades</p>
                                {/* Use transactions.length to dynamically show the total trades */}
                                <p className="text-2xl font-bold text-white">{transactions.length}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Win Rate</p>
                                <p className="text-2xl font-bold text-green-400">68%</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Portfolio Value</p>
                                <p className="text-2xl font-bold text-white">$24,156</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total Profit</p>
                                <p className="text-2xl font-bold text-green-400">$5,234</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Balance</p>
                                <p className="text-2xl font-bold text-white">
                                    ${balance.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Recent Activity */}
                    <section className="md:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
                        <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
                        {transactions.length > 0 ? (
                            <div className="space-y-4">
                                {transactions.map((transaction) => (
                                    <div key={transaction.id} className="bg-gray-700/30 rounded-lg p-4 border border-white/5">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-white font-medium">
                                                    {transaction.type === 'BUY'
                                                        ? 'Bought'
                                                        : transaction.type === 'SELL'
                                                            ? 'Sold'
                                                            : 'Traded'}{' '}
                                                    {transaction.stockSymbol}
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    {transaction.quantity} shares at ${transaction.price.toFixed(2)}
                                                </p>
                                            </div>
                                            <p className="text-sm text-gray-400">
                                                {formatRelativeTime(transaction.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-white">No recent activity</p>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
