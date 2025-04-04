"use client";

import { authClient } from '@/lib/auth-client';
import React, { useState } from 'react'

const AddFriendCard = () => {

    const {
        data: session,
    } = authClient.useSession();
    const user = session?.user;
    const [friendEmail, setFriendEmail] = useState('');
    const [friendError, setFriendError] = useState<string>('');



    const handleAddFriend = async () => {
        if (!user || !friendEmail) return;
        try {
            const res = await fetch('/api/user/add-friend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: friendEmail }),
            });
            const data = await res.json();
            if (data.success) {
                setFriendEmail('');
                setFriendError('');
            } else {
                setFriendError('Failed to add friend. Please try again later.');
            }
        } catch {
            setFriendError('Failed to add friend. Please try again later.');
        }
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/10">
                <h2 className="text-xl font-bold text-white mb-4">Add Friends</h2>
                <div className="bg-gray-800/50 rounded-lg p-3 border border-white/10 gap-2">
                    <div className="flex flex-col gap-2">
                        <input
                            type="email"
                            value={friendEmail}
                            onChange={(e) => setFriendEmail(e.target.value)}
                            placeholder="Enter your friend's email..."
                            className="w-full p-2 rounded-lg bg-gray-700/50 text-white border border-gray-600/50 focus:outline-none focus:border-blue-500"/>
                        <button
                            onClick={handleAddFriend}
                            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <span>Send Friend Request</span>
                        </button>
                    {friendError && <div className="text-red-400 mt-2">{friendError}
                    </div>}
                </div>
            </div>
        </div>)
}

export default AddFriendCard