'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MoreVertical } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface User {
  id: string;
  username?: string;
  profile_picture_url?: string;
  first_name?: string;
  last_name?: string;
}

interface LastMessage {
  content?: string;
  image_url?: string;
  created_at?: string;
  sender_id?: string;
  read_at?: string;
}

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  user1?: User;
  user2?: User;
  last_message_id?: string;
  created_at?: string;
  updated_at?: string;
  last_message?: LastMessage;
}

const AVATAR_COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500',
];

function getAvatarColor(id?: string): string {
  if (!id) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(user?: User | null): string {
  if (!user) return '?';
  const f = user.first_name?.[0] || '';
  const l = user.last_name?.[0] || '';
  if (f || l) return (f + l).toUpperCase();
  return (user.username?.[0] || '?').toUpperCase();
}

function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          if (data) setCurrentUser(data);
        }
      } catch (e) {
        console.error('Error fetching user:', e);
      }
    };
    getUser();
  }, []);

  const fetchUnreadCounts = useCallback(async (convos: Conversation[], userId: string) => {
    try {
      const counts: Record<string, number> = {};
      for (const conv of convos) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', userId)
          .is('read_at', null);
        counts[conv.id] = count || 0;
      }
      setUnreadCounts(counts);
    } catch (e) {
      console.error('Error fetching unread counts:', e);
    }
  }, []);

  const fetchOnlineStatus = useCallback(async (convos: Conversation[], userId: string) => {
    try {
      const otherIds = convos
        .map(c => c.user1_id === userId ? c.user2_id : c.user1_id)
        .filter(Boolean);
      if (otherIds.length === 0) return;

      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('user_sessions')
        .select('user_id')
        .in('user_id', otherIds)
        .gte('last_seen', fiveMinAgo);

      setOnlineUsers(new Set((data || []).map(d => d.user_id)));
    } catch (e) {
      console.error('Error fetching online status:', e);
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchConversations = async () => {
      try {
        const { data } = await supabase
          .from('conversations')
          .select(`
            *,
            user1:user1_id(id, username, profile_picture_url, first_name, last_name),
            user2:user2_id(id, username, profile_picture_url, first_name, last_name),
            last_message:last_message_id(content, image_url, created_at, sender_id, read_at)
          `)
          .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
          .order('updated_at', { ascending: false });

        if (data) {
          setConversations(data);
          fetchUnreadCounts(data, currentUser.id);
          fetchOnlineStatus(data, currentUser.id);
        }
      } catch (e) {
        console.error('Error fetching conversations:', e);
      }
      setLoading(false);
    };

    fetchConversations();

    const subscription = supabase
      .channel('conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .subscribe();

    // Refresh online status every 30s
    const onlineInterval = setInterval(() => {
      if (conversations.length > 0 && currentUser?.id) {
        fetchOnlineStatus(conversations, currentUser.id);
      }
    }, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(onlineInterval);
    };
  }, [currentUser?.id, fetchUnreadCounts, fetchOnlineStatus]);

  const getOtherUser = (conv: Conversation): User | null => {
    if (!currentUser) return null;
    return currentUser.id === conv.user1_id ? (conv.user2 || null) : (conv.user1 || null);
  };

  const getLastMessagePreview = (conv: Conversation): string => {
    if (!conv.last_message) return 'No messages yet';
    if (conv.last_message.image_url) return '📷 Image';
    return conv.last_message.content?.substring(0, 50) || 'No message';
  };

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherUser(conv);
    if (!other) return false;
    const q = searchQuery.toLowerCase();
    return (other.username?.toLowerCase()?.includes(q) ?? false) ||
           (other.first_name?.toLowerCase()?.includes(q) ?? false);
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
              const otherUser = getOtherUser(conv);
              if (!otherUser) return null;

              const unread = unreadCounts[conv.id] || 0;
              const isOnline = onlineUsers.has(otherUser.id);
              const isSentByMe = conv.last_message?.sender_id === currentUser?.id;
              const isRead = !!conv.last_message?.read_at;

              return (
                <Link key={conv.id} href={`/messages/${conv.id}`}>
                  <div className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer group">
                    {/* Avatar with online dot */}
                    <div className="relative flex-shrink-0">
                      {otherUser.profile_picture_url ? (
                        <Image
                          src={otherUser.profile_picture_url}
                          alt={otherUser.username || 'User'}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(otherUser.id)} flex items-center justify-center text-white text-xs font-semibold`}>
                          {getInitials(otherUser)}
                        </div>
                      )}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm ${unread > 0 ? 'font-bold text-black' : 'font-semibold text-gray-900'}`}>
                        {otherUser.username || otherUser.first_name || 'Unknown'}
                      </h3>
                      <p className={`text-xs truncate flex items-center gap-1 ${unread > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                        {isSentByMe && (
                          <span className={isRead ? 'text-blue-500' : 'text-gray-400'}>
                            {isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                        <span className="truncate">{getLastMessagePreview(conv)}</span>
                      </p>
                    </div>

                    {/* Time, badge, menu */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex flex-col items-end gap-1">
                        {conv.last_message?.created_at && (
                          <p className={`text-xs ${unread > 0 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                            {timeAgo(conv.last_message.created_at)}
                          </p>
                        )}
                        {unread > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="opacity-0 group-hover:opacity-100 transition"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
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
