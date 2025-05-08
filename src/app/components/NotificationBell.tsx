// src/components/NotificationBell.tsx

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'

interface FriendRequest {
  id: string
  requester: {
    id: string
    name: string | null
    email: string
  }
  timestamp: string
}

interface IncomingDM {
  id: string
  sender: { id: string; name: string }
  content: string        // matches your Prisma schema
  createdAt: string
}

interface NotificationDropdownProps {
  newDMs: IncomingDM[]
  requests: FriendRequest[]
  loading: boolean
  handleAcceptRequest: (requestId: string) => Promise<void>
  handleRejectRequest: (requestId: string) => Promise<void>
  onClose: () => void
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  newDMs,
  requests,
  loading,
  handleAcceptRequest,
  handleRejectRequest,
  onClose,
}) => {
  if (loading) {
    return <div className="p-4 text-center text-gray-400">Loading notifications…</div>
  }
  if (newDMs.length + requests.length === 0) {
    return <div className="p-4 text-center text-gray-400">No new notifications</div>
  }

  return (
    <div className="max-h-96 overflow-y-auto divide-y divide-gray-700/50">
      {/* Unread direct messages */}
      {newDMs.map(dm => (
        <div key={dm.id} className="p-4 bg-blue-900/20">
          <p className="text-white font-medium">
            You got a message from {dm.sender.name}
          </p>
          <p className="text-sm text-gray-300 truncate">“{dm.content}”</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(dm.createdAt).toLocaleTimeString()}
          </p>
        </div>
      ))}

      {/* Friend requests */}
      {requests.map(req => (
        <div key={req.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">
                {req.requester.name || req.requester.email}
              </p>
              <p className="text-xs text-gray-400">
                wants to follow your trading activity
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={e => { e.stopPropagation(); handleAcceptRequest(req.id) }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm"
              >
                Accept
              </button>
              <button
                onClick={e => { e.stopPropagation(); handleRejectRequest(req.id) }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface NotificationBellProps {
  refreshKey: any
  onBellClick: () => void
}

const NotificationBell: React.FC<NotificationBellProps> = ({ refreshKey, onBellClick }) => {
  const [isOpen, setIsOpen] = useState(false)

  // Friend-requests state
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)

  // Direct-message state
  const [newDMs, setNewDMs] = useState<IncomingDM[]>([])
  const lastCheckRef = useRef<string>(new Date().toISOString())

  // Portal mount flag
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const bellRef = useRef<HTMLButtonElement>(null)

  // Fetch friend requests
  const fetchRequests = async (): Promise<void> => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/friend-requests', { credentials: 'include' })
      const data = await res.json()
      setRequests(data.success ? data.requests : [])
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchRequests()
    const iv = setInterval(fetchRequests, 60000)
    return () => clearInterval(iv)
  }, [refreshKey])

  // Poll for new direct messages
  const fetchNewDMs = async (): Promise<void> => {
    const since = encodeURIComponent(lastCheckRef.current)
    try {
      const res = await fetch(`/api/user/unread-messages?since=${since}`, {
        credentials: 'include',
      })
      if (!res.ok) return
      const { success, messages }: { success: boolean; messages: IncomingDM[] } = await res.json()
      setNewDMs(success && Array.isArray(messages) ? messages : [])
    } catch {
      setNewDMs([])
    }
  }
  useEffect(() => {
    fetchNewDMs()
    const iv = setInterval(fetchNewDMs, 5000)
    return () => clearInterval(iv)
  }, [])

  // Toggle dropdown
  const handleBellClick = (): void => {
    onBellClick()
    setIsOpen(o => !o)
  }

  // When dropdown closes, reset since and clear messages
  useEffect(() => {
    if (!isOpen) {
      lastCheckRef.current = new Date().toISOString()
      setNewDMs([])
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const onOutside = (e: MouseEvent): void => {
      const dd = document.getElementById('notification-dropdown')
      if (
        bellRef.current &&
        !bellRef.current.contains(e.target as Node) &&
        dd &&
        !dd.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [isOpen])

  // Accept a friend request
  const handleAcceptRequest = async (requestId: string): Promise<void> => {
    const tid = toast.loading('Accepting friend request...')
    try {
      const res = await fetch('/api/user/accept-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ requestId }),
      })
      toast.dismiss(tid)
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Accepted')
        setRequests(r => r.filter(x => x.id !== requestId))
        fetchRequests()
      } else {
        toast.error(data.error || 'Failed')
      }
    } catch {
      toast.dismiss(tid)
      toast.error('Error')
    }
  }

  // Reject a friend request
  const handleRejectRequest = async (requestId: string): Promise<void> => {
    const tid = toast.loading('Rejecting friend request...')
    try {
      const res = await fetch('/api/user/reject-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ requestId }),
      })
      toast.dismiss(tid)
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Rejected')
        setRequests(r => r.filter(x => x.id !== requestId))
        fetchRequests()
      } else {
        toast.error(data.error || 'Failed')
      }
    } catch {
      toast.dismiss(tid)
      toast.error('Error')
    }
  }

  // Combined badge count
  const badgeCount = requests.length + newDMs.length

  return (
    <>
      <button
        ref={bellRef}
        onClick={handleBellClick}
        className="relative p-2 text-gray-400 hover:text-blue-600 transition-colors"
      >
        {/* bell icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 
               0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 
               2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 
               .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 
               11-6 0v-1m6 0H9"
          />
        </svg>
        {badgeCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {badgeCount}
          </span>
        )}
      </button>

      {mounted && isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-transparent pointer-events-none">
            <div
              id="notification-dropdown"
              className="fixed top-16 right-4 w-80 bg-gray-800 rounded-xl shadow-xl border border-gray-700/50 overflow-hidden pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-700/50">
                <h3 className="text-lg font-semibold text-white">Notifications</h3>
              </div>
              <NotificationDropdown
                newDMs={newDMs}
                requests={requests}
                loading={loading}
                handleAcceptRequest={handleAcceptRequest}
                handleRejectRequest={handleRejectRequest}
                onClose={() => setIsOpen(false)}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

export default NotificationBell
