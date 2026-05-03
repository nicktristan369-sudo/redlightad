'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ChevronLeft, MoreVertical, Paperclip, Smile, Send } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

interface Message {
  id: string;
  sender_id: string;
  content?: string;
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

export default function ChatPage() {
  const params = useParams();
  const conversationId = params?.conversationId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get current user
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

  // Fetch conversation
  useEffect(() => {
    if (!conversationId || !currentUser?.id) return;

    const fetchConversation = async () => {
      try {
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
          setOtherUser(other || null);
        }
      } catch (e) {
        console.error('Error fetching conversation:', e);
      }
      setLoading(false);
    };

    fetchConversation();
  }, [conversationId, currentUser?.id]);

  // Fetch messages
  useEffect(() => {
    if (!conversationId || !currentUser?.id) return;

    const fetchMessages = async () => {
      try {
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
          await fetch('/api/messages/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id: conversationId,
              user_id: currentUser.id
            })
          }).catch(() => {});
        }
      } catch (e) {
        console.error('Error fetching messages:', e);
      }
    };

    fetchMessages();

    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
        // Mark incoming as read
        if ((payload.new as Message).sender_id !== currentUser?.id) {
          fetch('/api/messages/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversation_id: conversationId,
              user_id: currentUser?.id
            })
          }).catch(() => {});
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        // Update read_at on existing messages
        setMessages(prev => prev.map(m => m.id === (payload.new as Message).id ? { ...m, ...payload.new } : m));
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, currentUser?.id]);

  // Track own online status
  useEffect(() => {
    if (!currentUser?.id) return;

    const updateStatus = () => {
      fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id })
      }).catch(() => {});
    };

    updateStatus();
    const interval = setInterval(updateStatus, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // Check other user status
  useEffect(() => {
    if (!otherUser?.id) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/status?user_id=${otherUser.id}`);
        if (res.ok) {
          const data = await res.json();
          setOtherUserOnline(data?.online ?? false);
          setLastSeen(data?.last_seen ?? null);
        }
      } catch {
        setOtherUserOnline(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [otherUser?.id]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('messages').upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('messages').getPublicUrl(fileName);
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

  const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨', '😢', '😡'];

  const blockUser = async () => {
    if (!currentUser || !otherUser) return;
    try {
      await fetch('/api/blocked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, blocked_user_id: otherUser.id })
      });
      window.location.href = '/messages';
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const deleteConversation = async () => {
    if (!conversationId || !currentUser) return;
    if (!confirm('Delete this conversation? This cannot be undone.')) return;
    try {
      await fetch('/api/conversations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, user_id: currentUser.id })
      });
      window.location.href = '/messages';
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const clearHistory = async () => {
    if (!conversationId || !currentUser) return;
    if (!confirm('Clear all messages? Messages will be deleted for you only.')) return;
    try {
      await fetch('/api/messages/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, user_id: currentUser.id })
      });
      setMessages([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  // Avatar component for consistency
  const Avatar = ({ user, size = 32 }: { user?: User | null; size?: number }) => {
    if (!user) {
      return (
        <div
          className={`rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold`}
          style={{ width: size, height: size, fontSize: size * 0.35 }}
        >
          ?
        </div>
      );
    }
    if (user.profile_picture_url) {
      return (
        <Image
          src={user.profile_picture_url}
          alt={user.username || 'User'}
          width={size}
          height={size}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      );
    }
    return (
      <div
        className={`rounded-full ${getAvatarColor(user.id)} flex items-center justify-center text-white font-semibold`}
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {getInitials(user)}
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!conversation) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Conversation not found</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/messages">
            <ChevronLeft className="w-5 h-5 cursor-pointer" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Avatar user={otherUser} size={40} />
              {otherUserOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div>
              <h2 className="font-semibold">{otherUser?.username || otherUser?.first_name || 'Unknown'}</h2>
              <p className="text-xs text-gray-500">
                {otherUserOnline ? (
                  <span className="text-green-500 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Online
                  </span>
                ) : lastSeen ? (
                  <>Last seen {timeAgo(lastSeen)}</>
                ) : (
                  'Offline'
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}>
            <MoreVertical className="w-5 h-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg z-50">
              <button onClick={blockUser} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
                Block user
              </button>
              <button onClick={clearHistory} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
                Clear history
              </button>
              <button onClick={deleteConversation} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600">
                Delete chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isMe = message.sender_id === currentUser?.id;
          return (
            <div
              key={message.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {!isMe && (
                <div className="mr-2 flex-shrink-0 self-end">
                  <Avatar user={otherUser} size={32} />
                </div>
              )}
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  isMe ? 'bg-red-500 text-white' : 'bg-gray-200 text-black'
                }`}
              >
                {message.image_url && (
                  <img
                    src={message.image_url}
                    alt="message"
                    className="max-w-sm rounded cursor-pointer mb-2"
                    onClick={() => message.image_url && window.open(message.image_url, '_blank')}
                  />
                )}
                {message.content && <p className="text-sm break-words">{message.content}</p>}
                <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-red-100' : 'text-gray-500'}`}>
                  <span>
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {isMe && (
                    <span className={message.read_at ? 'text-blue-300' : 'text-gray-300'}>
                      {message.read_at ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        {previewUrl && (
          <div className="mb-3 relative w-fit">
            <img src={previewUrl} alt="preview" className="max-w-xs rounded" />
            <button
              onClick={() => { setSelectedImage(null); setPreviewUrl(null); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
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
              <div className="absolute bottom-8 left-0 z-50 bg-white border rounded-lg shadow-lg p-2 grid grid-cols-5 gap-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { setMessageInput(prev => prev + emoji); setShowEmojiPicker(false); }}
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
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          <button onClick={sendMessage} className="text-red-500 hover:text-red-600">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
