'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/viewmodels/auth.viewmodel';
import { chatService, Conversation, Message } from '@/lib/services/chat.service';
import Layout from '@/components/layout/Layout';

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatMessageDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function groupMessagesByDate(messages: Message[]): { date: string; messages: Message[] }[] {
  const groups: { [key: string]: Message[] } = {};

  messages.forEach((msg) => {
    const dateKey = new Date(msg.created_at).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
  });

  return Object.entries(groups).map(([dateKey, msgs]) => ({
    date: formatMessageDate(msgs[0].created_at),
    messages: msgs,
  }));
}

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth?mode=signin');
      return;
    }

    const loadConversation = async () => {
      setIsLoading(true);
      try {
        const data = await chatService.getMessages(conversationId);
        setConversation(data.conversation);
        setMessages(data.messages);
      } catch (error) {
        console.error('Failed to load conversation:', error);
        router.push('/chat');
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();

    // Poll for new messages every 5 seconds
    const interval = setInterval(async () => {
      try {
        const data = await chatService.getMessages(conversationId);
        setMessages(data.messages);
      } catch (error) {
        // Ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [conversationId, isAuthenticated, _hasHydrated, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const message = await chatService.sendMessage(conversationId, newMessage.trim());
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const getOtherParticipant = () => {
    if (!conversation || !user) return { name: 'User', role: '' };
    if (conversation.volunteer_id === Number(user.id)) {
      return { name: conversation.poster_username, role: 'Poster' };
    }
    return { name: conversation.volunteer_username, role: 'Volunteer' };
  };

  const other = getOtherParticipant();
  const messageGroups = groupMessagesByDate(messages);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-180px)]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3 -mx-4 sm:mx-0 sm:rounded-t-xl sm:border">
          <button
            onClick={() => router.push('/chat')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-medium">
            {other.name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 truncate">{other.name}</h2>
            {conversation && (
              <p className="text-sm text-gray-500 truncate">{conversation.job.title}</p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 -mx-4 sm:mx-0">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messageGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <div className="flex justify-center mb-4">
                  <span className="px-3 py-1 bg-white text-gray-500 text-xs rounded-full shadow-sm">
                    {group.date}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.messages.map((msg) => {
                    const isMe = user && msg.sender_id === Number(user.id);
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                            isMe
                              ? 'bg-primary text-white rounded-br-md'
                              : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                          }`}
                        >
                          <p className="break-words">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                            {formatMessageTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="bg-white border-t border-gray-200 p-4 flex items-center gap-3 -mx-4 sm:mx-0 sm:rounded-b-xl sm:border"
        >
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
            maxLength={2000}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="p-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
}
