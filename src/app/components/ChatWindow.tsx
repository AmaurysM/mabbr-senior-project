'use client';

import { get } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

export interface Friend {
  id: string;
  name?: string;
  image?: string;
}

export interface DirectMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name?: string; image?: string };
}

interface ChatWindowProps {
  friend: Friend;
  onClose: (id: string) => void;
}

export default function ChatWindow({ friend, onClose }: ChatWindowProps) {
  const [msgs, setMsgs] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  // Drag start
  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setOff({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };
  // Drag move/end
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging) setPos({ x: e.clientX - off.x, y: e.clientY - off.y });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, off]);

  // Load messages
  useEffect(() => {
    if (!friend.id) return;
    let live = true;
    const load = async () => {
      const res = await fetch(`/api/chat/direct/getAllMessages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          friendID: friend.id,
        }),
      });
      if (res.ok && live) setMsgs(await res.json());
    };
    load();
    const iv = setInterval(load, 5000);
    return () => {
      live = false;
      clearInterval(iv);
    };
  }, [friend.id]);

  // Send
  const send = async () => {
    if (!draft.trim()) return;
    const res = await fetch(`/api/chat/direct`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: draft.trim(), friendID: friend.id })

    });
    if (res.ok) {
      const nm: DirectMessage = await res.json();
      setMsgs((prev) => [...prev, nm]);
      setDraft('');
    }
  };

  if (!friend.id || typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: pos.y,
        left: pos.x,
        width: 400,
        height: '60vh',
        zIndex: 9999,
      }}
    >
      <div className="bg-gray-900 text-white rounded shadow-lg flex flex-col h-full">
        {/* Header / drag handle */}
        <div
          onMouseDown={onMouseDown}
          className="cursor-grab bg-gray-800 px-4 py-2 flex justify-between rounded-t"
        >
          <span className="font-semibold">{friend.name || 'Chat'}</span>
          <button onClick={() => onClose(friend.id)}>×</button>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto p-3 bg-gray-700 space-y-2">
          {msgs.map((m) => (
            <div
              key={m.id}
              className={`px-2 py-1 rounded max-w-full ${m.sender.id === sessionStorage.getItem('userId')
                  ? 'bg-blue-600 self-end'
                  : 'bg-gray-600 self-start'
                }`}
            >
              {m.content}
              <div className="text-xs text-gray-300 text-right">
                {new Date(m.createdAt).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex border-t border-gray-600">
          <input
            type="text"
            className="flex-1 px-3 py-2 bg-gray-800 focus:outline-none"
            placeholder="Type a message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button onClick={send} className="px-4 bg-blue-600 hover:bg-blue-500">
            Send
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
