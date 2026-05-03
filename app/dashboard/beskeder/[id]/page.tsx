'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import DashboardLayout from '@/components/DashboardLayout';
import { ChevronLeft, Send } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface Message {
  id: string;
  sender_id: string;
  message?: string;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    profile_picture_url?: string;
    first_name: string;
    last_name: string;
  };
}

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
}

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);

  // Get current user
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

  // Fetch conversation
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const fetchConversation = async () => {
      try {
        const { data } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .maybeSingle();

        if (data) {
          const otherId = currentUserId === data.provider_id ? data.customer_id : data.provider_id;
          
          // Get other user data
          const { data: otherUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', otherId)
            .maybeSingle();

          setConversation({
            ...data,
            other_user: otherUser || { id: otherId, username: 'User', first_name: 'User', last_name: '' }
          });
        }
      } catch (error) {
        console.error('Error fetching conversation:', error);
      }
    };

    fetchConversation();
  }, [conversationId, currentUserId]);

  // Fetch messages
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      try {
        const { data } = await supabase
          .from('conversation_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (data) {
          // Enrich with sender data
          const enriched = await Promise.all(
            data.map(async (msg: any) => {
              const { data: sender } = await supabase
                .from('users')
                .select('*')
                .eq('id', msg.sender_id)
                .maybeSingle();

              return {
                ...msg,
                sender: sender || { id: msg.sender_id, username: 'User', first_name: 'User', last_name: '' }
              };
            })
          );

          setMessages(enriched);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversation_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload: any) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  const sendMessage = async () => {
    if (!messageInput.trim() || !conversationId || !currentUserId) return;

    try {
      const { error } = await supabase
        .from('conversation_messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: currentUserId,
          message: messageInput.trim(),
          created_at: new Date().toISOString()
        }]);

      if (!error) {
        setMessageInput('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!currentUserId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!conversation || !conversation.other_user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">Conversation not found</div>
      </DashboardLayout>
    );
  }

  const otherUser = conversation.other_user;

  return (
    <DashboardLayout>
      <div className="max-w-2xl h-screen flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/beskeder">
              <ChevronLeft className="w-5 h-5 cursor-pointer text-gray-600 hover:text-gray-900" />
            </Link>
            <div className="flex items-center gap-2">
              {otherUser.profile_picture_url ? (
                <Image
                  src={otherUser.profile_picture_url}
                  alt={otherUser.username}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-bold">
                  {otherUser.first_name?.[0]}{otherUser.last_name?.[0]}
                </div>
              )}
              <div>
                <h2 className="font-semibold text-sm">{otherUser.username}</h2>
                <p className="text-xs text-gray-500">Active now</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message, idx) => {
            const isOwn = message.sender_id === currentUserId;
            const sender = message.sender || { username: 'User', first_name: 'U', last_name: '' };
            const timestamp = new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={message.id} className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {!isOwn && (
                  <div className="flex-shrink-0">
                    {sender.profile_picture_url ? (
                      <Image
                        src={sender.profile_picture_url}
                        alt={sender.username}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                        {sender.first_name?.[0]}{sender.last_name?.[0]}
                      </div>
                    )}
                  </div>
                )}

                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-xs ${
                      isOwn
                        ? 'bg-red-500 text-white rounded-br-none'
                        : 'bg-gray-200 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm break-words">{message.message}</p>
                  </div>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-red-500' : 'text-gray-500'}`}>
                    {timestamp}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Write a message..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={sendMessage}
              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
