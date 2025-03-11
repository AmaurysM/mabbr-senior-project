import { authClient } from '@/lib/auth-client'
import { Post } from '@/lib/prisma_types'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { UserCircleIcon } from 'lucide-react'

const CommentCard = ({message}: {message:Post}) => {

    const { data: session, error } = authClient.useSession()
    const [poster,setPoster] = useState(null);


    return (
        <div
            key={message.id}
            className={`flex items-start gap-3 ${message.userId === (session?.user?.id || 'guest')
                ? 'bg-blue-600/20 rounded-xl p-3'
                : 'bg-gray-700/30 rounded-xl p-3'
                }`}
        >
            <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                {message.user.image ? (
                    <Image
                        src={message.user.image}
                        alt={message.user.name}
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
                    <span className="font-semibold text-white">{message.user.name}</span>
                    <span className="text-xs text-gray-400">{formatTimestamp(message.timestamp)}</span>
                </div>
                {formatMessageContent(message.content)}
            </div>
        </div>)
}

export default CommentCard