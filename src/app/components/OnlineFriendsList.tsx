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
  const [friends, setFriends] = useState<(Friend & { isOnline?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    friend: Friend | null;
  }>({ visible: false, friend: null });

  const [activeChats, setActiveChats] = useState<Friend[]>([]);

  // Load friends + online status
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

        const sessionsRes = await fetch('/api/user/active-sessions', {
          credentials: 'include',
        });
        const activeSessions = sessionsRes.ok
          ? (await sessionsRes.json()).activeSessions || {}
          : {};

        const withStatus = list.map((f: Friend) => {
          const last = activeSessions[f.id];
          const isOnline =
            last &&
            (Date.now() - new Date(last).getTime()) / 60000 <
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
    setContextMenu({ visible: true, friend: f });
  };

  // Hide context on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      const tgt = e.target as HTMLElement;
      if (!tgt.closest('.custom-context-menu')) {
        setContextMenu({ visible: false, friend: null });
      }
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const online = friends.filter((f) => f.isOnline);
  const offline = friends.filter((f) => !f.isOnline);

  return (
    <div className="space-y-4 px-1 relative overflow-visible">
      <h3 className="text-sm font-semibold text-gray-300">
        Online — {online.length}
      </h3>
      <ul className="space-y-2 overflow-visible">
        {online.map((f) => (
          <li key={f.id} className="relative overflow-visible">
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
              <div className="max-w-[100px] truncate">
                <span>{f.name || f.id}</span>
              </div>
            </button>


            {contextMenu.visible && contextMenu.friend?.id === f.id && (
              <div
                className="
                  custom-context-menu
                  absolute left-full top-1/2
                  transform -translate-y-1/2
                  -ml-4            /* pull the bubble 16px left */
                  bg-gray-900 border border-gray-700
                  rounded px-3 py-1 text-white text-sm z-50
                  overflow-visible
                "
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveChats((prev) =>
                      prev.some((x) => x.id === f.id) ? prev : [...prev, f]
                    );
                    setContextMenu({ visible: false, friend: null });
                  }}
                  className="hover:text-blue-400"
                >
                  💬 Message
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {offline.length > 0 && <div className="border-t border-gray-700" />}
      {offline.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-300">
            Offline — {offline.length}
          </h3>
          <ul className="space-y-2 overflow-visible">
            {offline.map((f) => (
              <li key={f.id} className="relative overflow-visible">
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

                {contextMenu.visible && contextMenu.friend?.id === f.id && (
                  <div
                    className="
                      custom-context-menu
                      absolute left-full top-1/2
                      transform -translate-y-1/2
                      -ml-20
                      bg-gray-900 border border-gray-700
                      rounded px-3 py-1 text-white text-sm z-50
                      overflow-visible
                    "
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveChats((prev) =>
                          prev.some((x) => x.id === f.id) ? prev : [...prev, f]
                        );
                        setContextMenu({ visible: false, friend: null });
                      }}
                      className="hover:text-blue-400"
                    >
                      💬 Message
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
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
