'use client';

import { useEffect, useState } from 'react';
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
  const conversationId = params.conversationId as string;
  
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

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser(data);
      }
    };
    getUser();
  }, []);

  // Fetch conversation and messages
  useEffect(() => {
    if (!conversationId) return;

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
        const other = currentUser?.id === conv.user1_id ? conv.user2 : conv.user1;
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
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .neq('sender_id', currentUser.id)
            .is('read_at', true);
        }
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
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

      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender_id: currentUser.id,
          content: messageInput.trim(),
          image_url: imageUrl,
          created_at: new Date().toISOString()
        }]);

      if (!error) {
        setMessageInput('');
        setSelectedImage(null);
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '💯', '✨', '😢', '😡'];

  const addEmoji = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!conversation || !otherUser) {
    return <div className="flex items-center justify-center h-screen">Conversation not found</div>;
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
              <h2 className="font-semibold">{otherUser.username}</h2>
              <p className="text-xs text-gray-500">Active now</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}>
            <MoreVertical className="w-5 h-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 bg-white border rounded-lg shadow-lg z-50">
              <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
                Block user
              </button>
              <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">
                Clear history
              </button>
              <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600">
                Delete chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'
            }`}
          >
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
                  : 'bg-gray-200 text-black'
              }`}
            >
              {message.image_url && (
                <img
                  src={message.image_url}
                  alt="message"
                  className="max-w-sm rounded cursor-pointer mb-2"
                  onClick={() => window.open(message.image_url, '_blank')}
                />
              )}
              {message.content && <p className="text-sm break-words">{message.content}</p>}
              <p className={`text-xs ${message.sender_id === currentUser?.id ? 'text-red-100' : 'text-gray-500'}`}>
                {new Date(message.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        {previewUrl && (
          <div className="mb-3 relative w-fit">
            <img src={previewUrl} alt="preview" className="max-w-xs rounded" />
            <button
              onClick={() => {
                setSelectedImage(null);
                setPreviewUrl(null);
              }}
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
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          <button
            onClick={sendMessage}
            className="text-red-500 hover:text-red-600"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
