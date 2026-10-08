'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Send, MessageSquare } from 'lucide-react';

interface ChatMessage {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface TeamChatProps {
  socket: Socket;
  myPlayerId: string;
  teamName: string;
}

export function TeamChat({ socket, myPlayerId, teamName }: TeamChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleMsg = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    };

    socket.on('chat:message', handleMsg);
    return () => {
      socket.off('chat:message', handleMsg);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    socket.emit('chat:message', { text: inputText.trim() });
    setInputText('');
  };

  return (
    <div className="flex flex-col h-72 w-full max-w-sm bg-white dark:bg-navy-800 border border-sky-200 dark:border-navy-700 rounded-2xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 bg-sky-50 dark:bg-navy-900 border-b border-sky-100 dark:border-navy-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {teamName} Chat
          </span>
        </div>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Private</span>
      </div>

      {/* Messages Scroll */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-[11px] italic">
            Coordinate strategy with teammates!
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.senderId === myPlayerId;
            return (
              <div
                key={idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-400 mb-0.5 font-medium">
                  {isMe ? 'You' : m.senderName}
                </span>
                <div
                  className={`px-3 py-1.5 rounded-xl max-w-[85%] break-words ${
                    isMe
                      ? 'bg-sky-500 text-white rounded-tr-none'
                      : 'bg-slate-100 dark:bg-navy-700 text-slate-800 dark:text-slate-200 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-2 border-t border-sky-100 dark:border-navy-700 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message teammates..."
          maxLength={150}
          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-sky-200 dark:border-navy-600 bg-sky-50/50 dark:bg-navy-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <button
          type="submit"
          className="p-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
