'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PencilIcon, CheckIcon, XMarkIcon, CameraIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { authClient } from "@/lib/auth-client";

interface EditableFieldProps {
    value: string;
    label: string;
    onSave: (value: string) => void;
    requireConfirmation?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({ value, label, onSave, requireConfirmation = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newValue, setNewValue] = useState(value);
    const [confirmValue, setConfirmValue] = useState('');
    const [error, setError] = useState('');

    // Update newValue when the prop value changes
    useEffect(() => {
        setNewValue(value);
    }, [value]);

    const handleSave = () => {
        if (requireConfirmation && newValue !== confirmValue) {
            setError('Values do not match');
            return;
        }
        onSave(newValue);
        setIsEditing(false);
        setError('');
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
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                        >
                            <CheckIcon className="h-4 w-4" />
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
    const [profileImage, setProfileImage] = useState<string>('/default-profile.png');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [bio, setBio] = useState('No bio yet.');
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [newBio, setNewBio] = useState(bio);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch user data when component mounts
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const { data: session } = await authClient.getSession();

                if (session?.user) {
                    // Set user data from session
                    setName(session.user.name || '');
                    setEmail(session.user.email || '');
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

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Show loading state while fetching user data
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
                            <Image
                                src={profileImage}
                                alt="Profile"
                                fill
                                className="object-cover"
                            />
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
                                onSave={setName}
                            />
                            <EditableField
                                label="Email"
                                value={email}
                                onSave={setEmail}
                                requireConfirmation
                            />
                            <div className="space-y-2">
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
                                                onClick={() => {
                                                    setBio(newBio);
                                                    setIsEditingBio(false);
                                                }}
                                                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                                            >
                                                <CheckIcon className="h-4 w-4" />
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
                                <p className="text-2xl font-bold text-white">156</p>
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
                            {/* Balance Field (Read-only) now placed under Trading Statistics */}
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
                        <div className="space-y-4">
                            {[1, 2, 3].map((_, index) => (
                                <div key={index} className="bg-gray-700/30 rounded-lg p-4 border border-white/5">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-white font-medium">Bought AAPL</p>
                                            <p className="text-sm text-gray-400">10 shares at $175.23</p>
                                        </div>
                                        <p className="text-sm text-gray-400">2 hours ago</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;