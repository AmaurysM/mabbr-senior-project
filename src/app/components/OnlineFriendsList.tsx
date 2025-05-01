'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { FaCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import ChatWindow, { Friend } from './ChatWindow';

const ONLINE_THRESHOLD_MINUTES = 2;
const POLLING_INTERVAL_MS = 15000;

export default function OnlineFriendsList() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    friend: Friend | null;
  }>({ visible: false, x: 0, y: 0, friend: null });

  const [activeChats, setActiveChats] = useState<Friend[]>([]);

  // Load friends + online status
  useEffect(() => {
    const fetchFriends = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/user/friends', {
          credentials: 'include'
        });
        if (!res.ok) throw new Error(res.statusText);
        const { friends: list } = await res.json();

        // Optionally fetch active sessions to mark online
        const sessionsRes = await fetch('/api/user/active-sessions', {
          credentials: 'include'
        });
        const activeSessions = sessionsRes.ok
          ? (await sessionsRes.json()).activeSessions || {}
          : {};

        const withStatus = list.map((f: Friend) => {
          const last = activeSessions[f.id];
          const isOnline =
            last &&
            (new Date().getTime() - new Date(last).getTime()) / 60000 <
              ONLINE_THRESHOLD_MINUTES;
          return { ...f, isOnline };
        });
        setFriends(withStatus);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
    const iv = setInterval(fetchFriends, POLLING_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [session?.user?.id]);

  const openProfile = (id: string) => {
    sessionStorage.setItem('selectedUserId', id);
    router.push('/friendsProfile');
  };

  const onRightClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    f: Friend
  ) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY - 40,
      friend: f
    });
  };

  // Hide context on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      const tgt = e.target as HTMLElement;
      if (!tgt.closest('.custom-context-menu')) {
        setContextMenu({ visible: false, x: 0, y: 0, friend: null });
      }
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const online = friends.filter((f: any) => f.isOnline);
  const offline = friends.filter((f: any) => !f.isOnline);

  return (
    <div className="space-y-4 px-1 relative">
      <h3 className="text-sm font-semibold text-gray-300">
        Online — {online.length}
      </h3>
      <ul className="space-y-2">
        {online.map((f) => (
          <li key={f.id}>
            <button
              onClick={() => openProfile(f.id)}
              onContextMenu={(e) => onRightClick(e, f)}
              className="flex items-center space-x-2 text-gray-300 hover:bg-gray-700/50 p-1 rounded"
            >
              {f.image ? (
                <Image
                  src={f.image}
                  alt={f.name || f.id}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              ) : (
                <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center">
                  {f.name?.[0] || f.id[0]}
                </div>
              )}
              <FaCircle className="text-green-500 text-xs" />
              <span className="truncate">{f.name || f.id}</span>
            </button>
          </li>
        ))}
      </ul>

      {offline.length > 0 && <div className="border-t border-gray-700" />}
      {offline.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-300">
            Offline — {offline.length}
          </h3>
          <ul className="space-y-2">
            {offline.map((f) => (
              <li key={f.id}>
                <button
                  onClick={() => openProfile(f.id)}
                  onContextMenu={(e) => onRightClick(e, f)}
                  className="flex items-center space-x-2 text-gray-500 hover:bg-gray-700/50 p-1 rounded"
                >
                  {f.image ? (
                    <Image
                      src={f.image}
                      alt={f.name || f.id}
                      width={28}
                      height={28}
                      className="rounded-full grayscale"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center">
                      {f.name?.[0] || f.id[0]}
                    </div>
                  )}
                  <span className="truncate">{f.name || f.id}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.friend && (
        <div
          className="custom-context-menu fixed bg-gray-900 border border-gray-700 rounded px-3 py-1 text-white text-sm z-50"
          style={{ top: contextMenu.y, left: contextMenu.x, transform: 'translate(-50%, -100%)' }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveChats((prev) =>
                prev.some((x) => x.id === contextMenu.friend!.id)
                  ? prev
                  : [...prev, contextMenu.friend!]
              );
              setContextMenu({ visible: false, x: 0, y: 0, friend: null });
            }}
          >
            💬 Message
          </button>
        </div>
      )}

      {/* Chat windows */}
      {activeChats.map((f) => (
        <ChatWindow
          key={f.id}
          friend={f}
          onClose={(id) => setActiveChats((prev) => prev.filter((x) => x.id !== id))}
        />
      ))}

      {loading && <div className="text-gray-400">Loading friends…</div>}
      {!loading && friends.length === 0 && (
        <div className="text-gray-400">No friends found.</div>
      )}
    </div>
  );
}
