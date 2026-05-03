'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import DashboardLayout from '@/components/DashboardLayout';
import { ChevronLeft, MoreVertical, Paperclip, Smile, Send } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface User {
  id: string;
  username: string;
  profile_picture_url: string;
  first_name: string;
  last_name: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  read_at?: string;
  sender?: User;
}

interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  user1?: User;
  user2?: User;
}

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨', '😢', '😠'];

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setCurrentUser(data);
      }
    };
    getUser();
  }, [router]);

  // Fetch conversation and messages
  useEffect(() => {
    if (!conversationId || !currentUser?.id) return;

    const fetchConversation = async () => {
      const { data: conv } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:user1_id(id, username, profile_picture_url, first_name, last_name),
          user2:user2_id(id, username, profile_picture_url, first_name, last_name)
        `)
        .eq('id', conversationId)
        .single();

      if (conv) {
        setConversation(conv);
        const other = currentUser.id === conv.user1_id ? conv.user2 : conv.user1;
        setOtherUser(other);
      }

      setLoading(false);
    };

    fetchConversation();
  }, [conversationId, currentUser?.id]);

  // Fetch messages
  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(id, username, profile_picture_url, first_name, last_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data);
        // Mark as read
        if (currentUser) {
          await fetch('/api/messages/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id: conversationId,
              user_id: currentUser.id
            })
          });
        }
      }
    };

    fetchMessages();

    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, currentUser?.id]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('messages')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('messages')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const sendMessage = async () => {
    if (!messageInput.trim() && !selectedImage) return;
    if (!conversationId || !currentUser) return;

    try {
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_id: currentUser.id,
          content: messageInput.trim(),
          image_url: imageUrl
        })
      });

      if (response.ok) {
        setMessageInput('');
        setSelectedImage(null);
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const addEmoji = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
  };

  const deleteConversation = async () => {
    if (!conversationId || !currentUser) return;
    if (!confirm('Delete this conversation? This cannot be undone.')) return;

    try {
      await fetch('/api/conversations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          user_id: currentUser.id
        })
      });
      router.push('/dashboard/beskeder');
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const blockUser = async () => {
    if (!currentUser || !otherUser) return;
    try {
      await fetch('/api/blocked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          blocked_user_id: otherUser.id
        })
      });
      router.push('/dashboard/beskeder');
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!conversation || !otherUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">Conversation not found</div>
      </DashboardLayout>
    );
  }

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
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-semibold">
                  {otherUser.first_name?.[0]}{otherUser.last_name?.[0]}
                </div>
              )}
              <div>
                <h2 className="font-semibold text-sm">{otherUser.username}</h2>
                <p className="text-xs text-gray-500">Active now</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button
                  onClick={blockUser}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-900"
                >
                  Block user
                </button>
                <button
                  onClick={deleteConversation}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
                >
                  Delete chat
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
              {message.sender_id !== currentUser?.id && otherUser && (
                <Image
                  src={otherUser.profile_picture_url || ''}
                  alt={otherUser.username}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full mr-2"
                />
              )}
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.sender_id === currentUser?.id
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-black'
                }`}
              >
                {message.image_url && (
                  <img
                    src={message.image_url}
                    alt="message"
                    className="max-w-sm rounded mb-2 cursor-pointer"
                    onClick={() => window.open(message.image_url, '_blank')}
                  />
                )}
                {message.content && <p className="text-sm break-words">{message.content}</p>}
                <p
                  className={`text-xs mt-1 ${
                    message.sender_id === currentUser?.id ? 'text-red-100' : 'text-gray-500'
                  }`}
                >
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          {previewUrl && (
            <div className="mb-3 relative w-fit">
              <img src={previewUrl} alt="preview" className="max-w-xs rounded" />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setPreviewUrl(null);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex gap-2 items-end">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="image-input"
              onChange={handleImageSelect}
            />
            <label htmlFor="image-input" className="cursor-pointer text-gray-500 hover:text-gray-700">
              <Paperclip className="w-5 h-5" />
            </label>

            <div className="relative">
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-gray-500 hover:text-gray-700">
                <Smile className="w-5 h-5" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-8 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 grid grid-cols-5 gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        addEmoji(emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-xl hover:bg-gray-100 p-1 rounded"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Write a message..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <button onClick={sendMessage} className="text-red-500 hover:text-red-600">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
