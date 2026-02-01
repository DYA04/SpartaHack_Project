'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/viewmodels/auth.viewmodel';
import { chatService, Conversation } from '@/lib/services/chat.service';
import Layout from '@/components/layout/Layout';

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ChatListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Handle redirect from job page with ?job=<id>
  useEffect(() => {
    const jobId = searchParams.get('job');
    if (jobId && _hasHydrated && isAuthenticated) {
      chatService.getConversationByJob(jobId)
        .then((conv) => {
          router.replace(`/chat/${conv.id}`);
        })
        .catch(() => {
          // No conversation found, stay on list
        });
    }
  }, [searchParams, _hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!isAuthenticated) {
      router.push('/auth?mode=signin');
      return;
    }

    const loadConversations = async () => {
      setIsLoading(true);
      try {
        const data = await chatService.getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [isAuthenticated, _hasHydrated, router]);

  const getOtherParticipant = (conv: Conversation) => {
    if (user && conv.volunteer_id === Number(user.id)) {
      return { name: conv.poster_username, role: 'Poster' };
    }
    return { name: conv.volunteer_username, role: 'Volunteer' };
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500 mb-4">No conversations yet.</p>
            <p className="text-sm text-gray-400">
              Conversations are created when a poster confirms your interest in a job.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => {
              const other = getOtherParticipant(conv);
              return (
                <button
                  key={conv.id}
                  onClick={() => router.push(`/chat/${conv.id}`)}
                  className="w-full bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-medium flex-shrink-0">
                      {other.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{other.name}</h3>
                        {conv.last_message && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {formatTimeAgo(conv.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{conv.job.title}</p>
                      {conv.last_message ? (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conv.last_message.sender_username === user?.username ? 'You: ' : ''}
                          {conv.last_message.content}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 mt-1">No messages yet</p>
                      )}
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="w-6 h-6 bg-primary text-white text-xs font-medium rounded-full flex items-center justify-center flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
