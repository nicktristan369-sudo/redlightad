'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Search, MoreVertical } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface OtherUser {
  id: string;
  display_name: string;
  avatar_url?: string | null;
}

interface ConversationData {
  id: string;
  provider_id: string;
  customer_id: string;
  other_user?: OtherUser;
  last_message?: {
    content?: string;
    created_at?: string;
    sender_id?: string;
  } | null;
  last_message_at?: string;
  unread_count?: number;
}

const AVATAR_COLORS = [
  '#EF4444', '#3B82F6', '#10B981', '#8B5CF6',
  '#F97316', '#EC4899', '#14B8A6', '#6366F1',
];

function getAvatarColor(id?: string): string {
  if (!id) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name[0]?.toUpperCase() || '?';
}

function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) setCurrentUserId(user.id);
      } catch (e) {
        console.error('Error getting user:', e);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const fetchConversations = async () => {
      try {
        const res = await fetch(`/api/conversations/list?user_id=${currentUserId}`);
        const data = await res.json();
        setConversations(data?.conversations || []);
      } catch (e) {
        console.error('Error fetching conversations:', e);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Refresh on conversation changes
    const subscription = supabase
      .channel('conversations-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [currentUserId]);

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const name = conv.other_user?.display_name?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            {searchQuery ? 'No conversations found' : 'No messages yet'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conv) => {
              const other = conv.other_user;
              const unread = conv.unread_count || 0;
              const msgTime = conv.last_message?.created_at || conv.last_message_at;
              const preview = conv.last_message?.content?.substring(0, 50) || 'No messages yet';

              return (
                <Link key={conv.id} href={`/messages/${conv.id}`}>
                  <div className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer group">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {other?.avatar_url ? (
                        <img
                          src={other.avatar_url}
                          alt={other.display_name || 'User'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                          style={{ backgroundColor: getAvatarColor(other?.id) }}
                        >
                          {getInitials(other?.display_name)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm ${unread > 0 ? 'font-bold text-black' : 'font-semibold text-gray-900'}`}>
                        {other?.display_name || 'Unknown'}
                      </h3>
                      <p className={`text-xs truncate ${unread > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                        {preview}
                      </p>
                    </div>

                    {/* Time + badge */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {msgTime && (
                        <p className={`text-xs ${unread > 0 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                          {timeAgo(msgTime)}
                        </p>
                      )}
                      {unread > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
