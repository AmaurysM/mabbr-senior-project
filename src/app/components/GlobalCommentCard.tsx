import { authClient } from '@/lib/auth-client'
import { PostWithLikes } from '@/lib/prisma_types'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { UserCircleIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

const GlobalCommentCard = ({ message }: { message: PostWithLikes }) => {
    const { data: session } = authClient.useSession()
    const [poster, setPoster] = useState<{ name: string; image: string | null } | null>(null);

    const router = useRouter();

    useEffect(() => {
        fetch("/api/user/getUser", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId: message.userId }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    console.error(data.error);
                } else {
                    setPoster(data);
                }
            })
            .catch(() => {
                console.error("Error fetching user");
            });
    }, [message.userId])


    const formatTimestamp = (date: Date) => formatDistanceToNow(new Date(date), { addSuffix: true });

    const handleProfileClick = () => {
        sessionStorage.setItem("selectedUserId", message.userId);
        router.push(`/friendsProfile`)
    }


    return (
        <div
            key={message.id}
            className={`flex items-start gap-3 ${message.userId === session?.user?.id
                ? 'bg-blue-600/20 rounded-xl p-3'
                : 'bg-gray-700/30 rounded-xl p-3'
                }`}
        >
            <div
                className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center cursor-pointer"
                onClick={handleProfileClick}
            >
                {poster?.image ? (
                    <Image
                        src={poster.image}
                        alt={poster.name || 'User avatar'}
                        width={40}
                        height={40}
                        className="object-cover"
                    />
                ) : (
                    <UserCircleIcon className="w-10 h-10 text-gray-400" />
                )}
            </div>

            <div className="flex-grow">
                <div className="flex justify-between items-center mb-1">
                    <span
                        className="font-semibold text-white cursor-pointer hover:underline"
                        onClick={handleProfileClick}
                    >
                        {poster?.name || 'Unknown User'}
                    </span>
                    <span className="text-xs text-gray-400">{formatTimestamp(message.createdAt)}</span>
                </div>
                {message.content && (
                    <p className="text-white">{message.content}</p>
                )}
                {message.imageUrl && (
                    <Image
                        src={message.imageUrl}
                        alt="Attached image"
                        width={400}
                        height={400}
                        className="mt-2 rounded-lg"
                    />
                )}

            </div>
        </div>
    )
}

export default GlobalCommentCard