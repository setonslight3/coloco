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
    <div className="flex flex-col h-80 w-full bg-white dark:bg-navy-900 border border-sky-200/80 dark:border-navy-700 rounded-3xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-navy-800/80 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
            {teamName} Chat
          </span>
        </div>
        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black px-2 py-0.5 rounded-full bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700">
          Private
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic text-center p-4">
            <span>Coordinate strategy with teammates in your private channel!</span>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.senderId === myPlayerId;
            return (
              <div
                key={idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}
              >
                <span className="text-[10px] text-slate-400 mb-0.5 px-1 font-medium">
                  {isMe ? 'You' : m.senderName}
                </span>
                <div
                  className={`px-3.5 py-2 rounded-2xl max-w-[88%] break-words whitespace-pre-wrap leading-relaxed ${
                    isMe
                      ? 'bg-sky-500 text-white rounded-tr-xs shadow-xs'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-800 dark:text-slate-200 rounded-tl-xs shadow-xs'
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

      {/* Input Field */}
      <form onSubmit={sendMessage} className="p-2.5 border-t border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message teammates..."
          maxLength={150}
          className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-sky-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white shadow-xs transition-transform active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
