'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ChevronLeft, MoreVertical, Paperclip, Smile, Send } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  sender_id: string;
  content?: string;
  image_url?: string;
  created_at: string;
  read_at?: string;
}

interface OtherUser {
  id: string;
  display_name: string;
  avatar_url?: string | null;
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

export default function ChatPage() {
  const params = useParams();
  const conversationId = params?.conversationId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) setCurrentUserId(user.id);
      } catch (e) {
        console.error('Error getting user:', e);
      }
    };
    getUser();
  }, []);

  // Fetch conversation + other user info
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const fetchConversation = async () => {
      try {
        const supabase = createClient();
        const { data: conv } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (!conv) { setLoading(false); return; }

        const otherId = currentUserId === conv.provider_id ? conv.customer_id : conv.provider_id;

        // Get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email, username')
          .eq('id', otherId)
          .maybeSingle();

        let displayName = profile?.full_name || profile?.username || profile?.email || 'User';

        // Check if other user is provider → get listing display name
        if (otherId === conv.provider_id) {
          const { data: listing } = await supabase
            .from('listings')
            .select('display_name')
            .eq('user_id', otherId)
            .limit(1)
            .maybeSingle();
          if (listing?.display_name) displayName = listing.display_name;
        }

        setOtherUser({
          id: otherId,
          display_name: displayName,
          avatar_url: profile?.avatar_url || null,
        });
      } catch (e) {
        console.error('Error fetching conversation:', e);
      }
      setLoading(false);
    };

    fetchConversation();
  }, [conversationId, currentUserId]);

  // Fetch messages
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const fetchMessages = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (data) {
          setMessages(data);
          // Mark as read
          fetch('/api/messages/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation_id: conversationId, user_id: currentUserId })
          }).catch(() => {});
        }
      } catch (e) {
        console.error('Error fetching messages:', e);
      }
    };

    fetchMessages();

    const sub_supabase = createClient();
    const subscription = sub_supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
        if ((payload.new as Message).sender_id !== currentUserId) {
          fetch('/api/messages/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversation_id: conversationId, user_id: currentUserId })
          }).catch(() => {});
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages(prev => prev.map(m => m.id === (payload.new as Message).id ? { ...m, ...payload.new } : m));
      })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [conversationId, currentUserId]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() && !selectedImage) return;
    if (!conversationId || !currentUserId) return;

    try {
      let imageUrl = null;
      if (selectedImage) {
        const supabase = createClient();
        const fileName = `${Date.now()}-${selectedImage.name}`;
        const { error } = await supabase.storage.from('messages').upload(fileName, selectedImage);
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('messages').getPublicUrl(fileName);
          imageUrl = publicUrl;
        }
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: messageInput.trim(),
          image_url: imageUrl
        })
      });

      if (res.ok) {
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
    if (!currentUserId || !otherUser) return;
    try {
      await fetch('/api/blocked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId, blocked_user_id: otherUser.id })
      });
      window.location.href = '/messages';
    } catch (e) { console.error('Error blocking:', e); }
  };

  const deleteConversation = async () => {
    if (!conversationId || !currentUserId) return;
    if (!confirm('Delete this conversation? This cannot be undone.')) return;
    try {
      await fetch('/api/conversations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, user_id: currentUserId })
      });
      window.location.href = '/messages';
    } catch (e) { console.error('Error deleting:', e); }
  };

  const clearHistory = async () => {
    if (!conversationId || !currentUserId) return;
    if (!confirm('Clear all messages?')) return;
    try {
      await fetch('/api/messages/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, user_id: currentUserId })
      });
      setMessages([]);
    } catch (e) { console.error('Error clearing:', e); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!otherUser) {
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
            {otherUser.avatar_url ? (
              <img
                src={otherUser.avatar_url}
                alt={otherUser.display_name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: getAvatarColor(otherUser.id) }}
              >
                {getInitials(otherUser.display_name)}
              </div>
            )}
            <h2 className="font-semibold">{otherUser.display_name}</h2>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}>
            <MoreVertical className="w-5 h-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg z-50">
              <button onClick={blockUser} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Block user</button>
              <button onClick={clearHistory} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Clear history</button>
              <button onClick={deleteConversation} className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600">Delete chat</button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <div className="mr-2 flex-shrink-0 self-end">
                  {otherUser.avatar_url ? (
                    <img src={otherUser.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                      style={{ backgroundColor: getAvatarColor(otherUser.id) }}
                    >
                      {getInitials(otherUser.display_name)}
                    </div>
                  )}
                </div>
              )}
              <div className={`max-w-xs px-4 py-2 rounded-lg ${isMe ? 'bg-red-500 text-white' : 'bg-gray-200 text-black'}`}>
                {msg.image_url && (
                  <img
                    src={msg.image_url}
                    alt="attachment"
                    className="max-w-sm rounded cursor-pointer mb-2"
                    onClick={() => msg.image_url && window.open(msg.image_url, '_blank')}
                  />
                )}
                {msg.content && <p className="text-sm break-words">{msg.content}</p>}
                <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-red-100' : 'text-gray-500'}`}>
                  <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMe && (
                    <span style={{ color: msg.read_at ? '#93C5FD' : '#D1D5DB' }}>
                      {msg.read_at ? '✓✓' : '✓'}
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
            >×</button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <input type="file" accept="image/*" className="hidden" id="image-input" onChange={handleImageSelect} />
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
                  <button key={emoji} onClick={() => { setMessageInput(prev => prev + emoji); setShowEmojiPicker(false); }} className="text-xl hover:bg-gray-100 p-1 rounded">
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
