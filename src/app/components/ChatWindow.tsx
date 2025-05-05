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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendID: friend.id }),
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
      body: JSON.stringify({ content: draft.trim(), friendID: friend.id }),
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
      <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div
          onMouseDown={onMouseDown}
          className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 p-3 cursor-grab"
        >
          <div className="flex items-center space-x-2">
            {friend.image && (
              <img
                src={friend.image}
                alt={friend.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <span className="text-white font-semibold">
              {friend.name || 'Chat'}
            </span>
          </div>
          <button onClick={() => onClose(friend.id)} className="text-white text-xl">
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-3 bg-gray-700">
          {msgs.map((m) => {
            const isMe = m.sender.id === sessionStorage.getItem('userId');
            return (
              <div
                key={m.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-2xl break-words ${
                    isMe ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-100'
                  }`}
                >
                  {m.content}
                  <div className="text-xs text-gray-300 text-right mt-1">
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="flex items-center p-3 bg-gray-800 border-t border-gray-600">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Type a message…"
            className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={send}
            className="ml-3 p-2 bg-blue-600 hover:bg-blue-500 rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2.94 2c.398-.03.773.247.822.651l.39 4.68c.044.523-.498.845-.937.558L2 7.692v4.616l.215.107 3.4 1.698c.438.219.436.86-.002 1.077l-3.4 1.698-.215.107v1.923c0 .543-.602.83-1.048.503L.08 16.503C-.33 16.17-.33 15.63.08 15.297l7.207-7.805-7.207-7.805C-.33 1.63-.33 1.09.08.757L1.892-1.043C2.338-.37 2.542.23 2.94 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
