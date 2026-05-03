'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface User {
  id: string;
  username: string;
  profile_picture_url?: string;
  first_name: string;
  last_name: string;
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
  last_message?: {
    content?: string;
    image_url?: string;
    created_at?: string;
  };
}

export default function BeskederPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return; // DashboardLayout already handles auth

        // Try to fetch user data, but don't fail if not found
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (data) {
          setCurrentUser(data);
        } else {
          // User logged in but not in users table - create temp profile
          const tempUser: User = {
            id: user.id,
            username: user.email?.split('@')[0] || 'User',
            first_name: user.user_metadata?.first_name || 'User',
            last_name: user.user_metadata?.last_name || '',
            profile_picture_url: user.user_metadata?.avatar_url
          };
          setCurrentUser(tempUser);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchConversations = async () => {
      const { data } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:user1_id(id, username, profile_picture_url, first_name, last_name),
          user2:user2_id(id, username, profile_picture_url, first_name, last_name),
          last_message:last_message_id(content, image_url, created_at)
        `)
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .order('updated_at', { ascending: false });

      if (data) {
        setConversations(data);
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

    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser?.id]);

  const getOtherUser = (conv: Conversation): User | null => {
    if (!currentUser) return null;
    return currentUser.id === conv.user1_id ? conv.user2 || null : conv.user1 || null;
  };

  const getLastMessagePreview = (conv: Conversation): string => {
    if (!conv.last_message) return 'No messages yet';
    if (conv.last_message.image_url) return '📷 Image';
    return conv.last_message.content?.substring(0, 50) || 'No message';
  };

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherUser(conv);
    return (
      other?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      other?.first_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Show loading while fetching user data
  if (!currentUser) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

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
        {loading ? (
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
              const otherUser = getOtherUser(conv);
              if (!otherUser) return null;

              return (
                <Link key={conv.id} href={`/dashboard/beskeder/${conv.id}`}>
                  <div className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer group">
                    {/* Avatar */}
                    {otherUser.profile_picture_url ? (
                      <Image
                        src={otherUser.profile_picture_url}
                        alt={otherUser.username}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {otherUser.first_name?.[0]}{otherUser.last_name?.[0]}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-semibold text-sm text-gray-900">{otherUser.username}</h3>
                        {conv.last_message?.created_at && (
                          <p className="text-xs text-gray-400">
                            {new Date(conv.last_message.created_at).toLocaleTimeString([], {
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
