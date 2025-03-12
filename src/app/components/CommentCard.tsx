import { authClient } from '@/lib/auth-client'
import { PostWithLikes } from '@/lib/prisma_types'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { UserCircleIcon, HeartIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

const CommentCard = ({ message }: { message: PostWithLikes }) => {
    const { data: session } = authClient.useSession()
    const [poster, setPoster] = useState<{ name: string; image: string | null } | null>(null);
    const [likeCount, setLikeCount] = useState<number>(message?.likes?.length || 0)
    const [isLiked, setIsLiked] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`/api/user/${message.userId}`)
                if (!res.ok) throw new Error('Failed to fetch user')
                const userData = await res.json()
                setPoster(userData)
            } catch (error) {
                console.error('Error fetching user:', error)
            }
        }
        fetchUser()
    }, [message.userId])

    useEffect(() => {
        // Check if the user has already liked the post
        if (session?.user?.id) {
            setIsLiked(message.likes?.some(like => like.userId === session.user.id) || false)
        }
    }, [message.likes, session?.user?.id])

    const formatTimestamp = (date: Date) => formatDistanceToNow(new Date(date), { addSuffix: true });

    const handleProfileClick = () => {
        router.push(`/profile/${message.userId}`)
    }

    const handleLike = async () => {
        if (!session?.user?.id || isLoading) {
            return;
        }

        setIsLoading(true);

        try {
            // For App Router
            const method = isLiked ? 'DELETE' : 'POST';
            
            // Optimistic UI update
            setIsLiked(!isLiked);
            setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
            
            const res = await fetch('/api/like', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: message.id }),
            });

            if (!res.ok) {
                // Revert optimistic update if the request fails
                setIsLiked(isLiked);
                setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
                
                const errorData = await res.json();
                throw new Error(errorData.error || `Failed to ${isLiked ? 'unlike' : 'like'} post`);
            }

            const data = await res.json();
            // Update with actual server data if needed
            if (data.likeCount !== undefined) {
                setLikeCount(data.likeCount);
            }
            
            // Refresh the router to update any server components if needed
            router.refresh();
            
        } catch (error) {
            console.error('Error handling like:', error);
        } finally {
            setIsLoading(false);
        }
    };

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
                {/* Like Button */}
                <div className="flex items-center gap-2 mt-2">
                    <button 
                        onClick={handleLike} 
                        className={`flex items-center gap-1 text-gray-400 hover:text-red-500 ${isLoading ? 'opacity-50' : ''}`}
                        disabled={!session?.user?.id || isLoading}
                    >
                        <HeartIcon className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                        <span>{likeCount}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CommentCard