'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, MoreVertical } from 'lucide-react';
import Link from 'next/link';

interface OtherUser {
  id: string;
  display_name: string;
  avatar_url?: string | null;
}

interface Conversation {
  id: string;
  provider_id: string;
  customer_id: string;
  other_user?: OtherUser;
  last_message?: {
    content?: string;
    created_at?: string;
  } | null;
  last_message_at?: string;
  unread_count?: number;
}

const AVATAR_COLORS = ['#EF4444','#3B82F6','#10B981','#8B5CF6','#F97316','#EC4899','#14B8A6','#6366F1'];

function getAvatarColor(id?: string): string {
  if (!id) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  if (p.length >= 2) return (p[0][0] + p[p.length-1][0]).toUpperCase();
  return name[0]?.toUpperCase() || '?';
}

export default function BeskederPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) setCurrentUserId(user.id);
      } catch (e) { console.error('Error getting user:', e); }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!currentUserId) { setLoading(false); return; }

    const fetchConversations = async () => {
      try {
        const res = await fetch(`/api/conversations/list?user_id=${currentUserId}`);
        const result = await res.json();
        setConversations(result?.conversations || []);
      } catch (e) {
        console.error('Error fetching conversations:', e);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUserId]);

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const name = conv.other_user?.display_name?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-500 text-sm mb-6">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {!currentUserId || loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-16 text-center">
            <p className="text-gray-500">{searchQuery ? 'No conversations found' : 'No messages yet'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            {filteredConversations.map((conv) => {
              const other = conv.other_user;
              if (!other) return null;
              const unread = conv.unread_count || 0;
              const preview = conv.last_message?.content?.substring(0, 50) || 'No messages yet';

              return (
                <Link key={conv.id} href={`/dashboard/beskeder/${conv.id}`}>
                  <div className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer group">
                    {other.avatar_url ? (
                      <img src={other.avatar_url} alt={other.display_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ backgroundColor: getAvatarColor(other.id) }}>
                        {getInitials(other.display_name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className={`text-sm ${unread > 0 ? 'font-bold text-black' : 'font-semibold text-gray-900'}`}>{other.display_name}</h3>
                        {conv.last_message_at && (
                          <p className="text-xs text-gray-400">{new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        )}
                      </div>
                      <p className={`text-xs truncate ${unread > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{preview}</p>
                    </div>
                    {unread > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{unread > 99 ? '99+' : unread}</span>
                    )}
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="opacity-0 group-hover:opacity-100 transition">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
