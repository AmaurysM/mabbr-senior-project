'use client';

import Image from 'next/image';
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import ChatWindow, { Friend } from './ChatWindow';

const ONLINE_THRESHOLD_MINUTES = 2;
const POLLING_INTERVAL_MS = 15000;

export default function OnlineFriendsList() {
  const [friends, setFriends] = useState<(Friend & { isOnline?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = authClient.useSession();
  const router = useRouter();

  // Context menu state and position
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    friend: Friend | null;
    x: number;
    y: number;
  }>({ visible: false, friend: null, x: 0, y: 0 });

  const [activeChats, setActiveChats] = useState<Friend[]>([]);

  const portalContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = document.createElement('div');
    portalContainerRef.current = container;
    document.body.appendChild(container);

    return () => {
      if (portalContainerRef.current) {
        document.body.removeChild(portalContainerRef.current);
        portalContainerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/user/friends', { credentials: 'include' });
        if (!res.ok) throw new Error(res.statusText);
        const { friends: list } = await res.json();

        const sessionsRes = await fetch('/api/user/active-sessions', { credentials: 'include' });
        const activeSessions = sessionsRes.ok
          ? (await sessionsRes.json()).activeSessions || {}
          : {};

        const withStatus = list.map((f: Friend) => {
          const last = activeSessions[f.id];
          const isOnline =
            last && (Date.now() - new Date(last).getTime()) / 60000 < ONLINE_THRESHOLD_MINUTES;
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

  const onRightClick = (e: React.MouseEvent<HTMLButtonElement>, f: Friend) => {
    e.preventDefault();
    setContextMenu({ visible: true, friend: f, x: e.clientX, y: e.clientY });
  };

  // Close context menu on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      const tgt = e.target as HTMLElement;
      if (!tgt.closest('.custom-context-menu')) {
        setContextMenu({ visible: false, friend: null, x: 0, y: 0 });
      }
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const online = friends.filter(f => f.isOnline);
  const offline = friends.filter(f => !f.isOnline);

  return (
    <div className="space-y-4 px-1 relative overflow-visible">
      <h3 className="text-sm font-semibold text-gray-300">
        Online — {online.length}
      </h3>
      <ul className="space-y-2 overflow-visible">
        {online.map(f => (
          <li key={f.id} className="relative">
            <button
              onClick={() => openProfile(f.id)}
              onContextMenu={e => onRightClick(e, f)}
              className="w-full flex items-center space-x-2 text-gray-300 hover:bg-gray-700/50 rounded-lg p-1.5 transition-colors text-left"
            >
              {f.image ? (
                <Image
                  src={f.image}
                  alt={f.name || f.id}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center">
                  {f.name?.[0] || f.id[0]}
                </div>
              )}
              <FaCircle className="text-green-500 text-xs" />
              <span className="text-sm truncate max-w-[100px]">{f.name || f.id}</span>
            </button>


            

          </li>
        ))}
      </ul>

      {offline.length > 0 && <div className="border-t border-gray-700" />}
      {offline.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-300 overflow">
            Offline — {offline.length}
          </h3>
          <ul className="space-y-2 overflow-visible">
            {offline.map(f => (
              <li key={f.id} className="relative">
                <button
                  onClick={() => openProfile(f.id)}
                  onContextMenu={e => onRightClick(e, f)}
                  className="w-full flex items-center space-x-2 text-gray-500 hover:bg-gray-700/50 rounded-lg p-1.5 transition-colors text-left"
                >
                  {f.image ? (
                    <Image
                      src={f.image}
                      alt={f.name || f.id}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover grayscale"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-gray-700 rounded-full flex items-center justify-center">
                      {f.name?.[0] || f.id[0]}
                    </div>
                  )}
                  <span className="text-sm truncate max-w-[100px]">{f.name || f.id}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Chat windows */}
      {activeChats.map(f => (
        <ChatWindow
          key={f.id}
          friend={f}
          onClose={id => setActiveChats(prev => prev.filter(x => x.id !== id))}
        />
      ))}

      {/* Context menu via portal */}
      {contextMenu.visible && contextMenu.friend && portalContainerRef.current &&
        createPortal(
          <div
            className="custom-context-menu bg-gray-900 border border-gray-700 rounded px-3 py-1 text-white text-sm shadow-lg"
            style={{
              position: 'absolute',
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 1000,
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={e => {
                e.stopPropagation();
                setActiveChats(prev =>
                  prev.some(x => x.id === contextMenu.friend!.id)
                    ? prev
                    : [...prev, contextMenu.friend!]
                );
                setContextMenu({ visible: false, friend: null, x: 0, y: 0 });
              }}
              className="hover:text-blue-400"
            >
              💬 Message
            </button>
          </div>,
          portalContainerRef.current
        )
      }

      {loading && <div className="text-gray-400">Loading friends…</div>}
      {!loading && friends.length === 0 && (
        <div className="text-gray-400">No friends found.</div>
      )}
    </div>
  );
}
