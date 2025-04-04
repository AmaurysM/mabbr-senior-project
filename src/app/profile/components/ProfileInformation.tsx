"use client";

import React, { useEffect, useState } from 'react'
import EditableField from './EditableField'
import { CheckIcon, PencilIcon } from 'lucide-react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import { authClient } from '@/lib/auth-client'
import { toast } from '@/app/hooks/use-toast';
import { useRouter } from 'next/navigation';

const ProfileInformation = (

) => {
    const { data: session } = authClient.useSession();
    const [bio, setBio] = useState("");
    const [newBio, setNewBio] = useState("");
    const [isSavingBio, setIsSavingBio] = useState(false);
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`/api/user?id=${session?.user.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch user data');
                }

                const data = await response.json();
                setBio(data.bio || '');
                setNewBio(data.bio || '');
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [session?.user.id]);



    const updateBio = async () => {
        if (!session) return;

        try {
            setIsSavingBio(true);

            const response = await fetch(`/api/user?id=${session.user.id}`, {
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

    const updateName = async (newName: string) => {
        if (!session) return;

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
        if (!session) return;

        try {

            await authClient.changeEmail({
                newEmail: newEmail,
            });
            router.refresh();

        } catch (error) {
            console.error('Error updating email:', error);
            toast({
                title: "Error",
                description: "Failed to update email",
            });
        } finally {
            router.refresh();
        }

    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>
            <div className="space-y-6">
                <EditableField
                    label="Name"
                    value={session?.user.name || ''}
                    onSave={updateName}
                />
                <EditableField
                    label="Email"
                    value={session?.user.email || ''}
                    onSave={updateEmail}
                    requireConfirmation
                />
                <div className="group relative">
                    <div className="flex items-center">
                        <label className="block text-sm font-medium text-gray-400">Bio</label>
                        <button
                            onClick={() => setIsEditingBio(true)}
                            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <PencilIcon className="h-4 w-4 text-blue-400 hover:text-blue-500" />
                        </button>
                    </div>
                    {!isEditingBio ? (
                        <p className="text-white whitespace-pre-wrap mt-2">{bio}</p>
                    ) : (
                        <div className="space-y-2 mt-2">
                            <textarea
                                value={newBio}
                                onChange={(e) => setNewBio(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700/30 rounded-lg border border-white/5 focus:border-blue-500/50 focus:outline-none transition-colors text-white"
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
                                    onClick={() => setIsEditingBio(false)}
                                    className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>)
}

export default ProfileInformation