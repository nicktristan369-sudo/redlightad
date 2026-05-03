'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface Conversation {
  id: string;
  provider_id: string;
  customer_id: string;
  other_user?: {
    id: string;
    username: string;
    profile_picture_url?: string;
    first_name: string;
    last_name: string;
  };
  last_message?: {
    message?: string;
    created_at?: string;
  };
  last_message_at?: string;
}

export default function BeskederPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error('Error getting user:', error);
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
        const response = await fetch(`/api/conversations/list?user_id=${currentUserId}`);
        const result = await response.json();
        console.log('Conversations response:', result);
        setConversations(result.conversations || []);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUserId]);

  const getLastMessagePreview = (conv: Conversation): string => {
    if (!conv.last_message?.message) return 'No messages yet';
    return conv.last_message.message.substring(0, 50);
  };

  const filteredConversations = conversations.filter(conv => {
    const other = conv.other_user;
    return (
      other?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      other?.first_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-500 text-sm mb-6">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>

        {/* Search */}
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

        {/* Conversations List */}
        {!currentUserId ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 sm:p-16 text-center">
            <p className="text-gray-500">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            {filteredConversations.map((conv) => {
              const other = conv.other_user;
              if (!other) return null;

              return (
                <Link key={conv.id} href={`/dashboard/beskeder/${conv.id}`}>
                  <div className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer group">
                    {/* Avatar */}
                    {other.profile_picture_url ? (
                      <Image
                        src={other.profile_picture_url}
                        alt={other.username}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {other.first_name?.[0]}{other.last_name?.[0]}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-semibold text-sm text-gray-900">{other.username}</h3>
                        {conv.last_message_at && (
                          <p className="text-xs text-gray-400">
                            {new Date(conv.last_message_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {getLastMessagePreview(conv)}
                      </p>
                    </div>

                    {/* Menu */}
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
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
