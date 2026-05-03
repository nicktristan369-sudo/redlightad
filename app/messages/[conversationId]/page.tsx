'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ChevronLeft, MoreVertical, Paperclip, Smile, Send, X, Loader2, BellOff, Bell } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

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

const AVATAR_COLORS = ['#EF4444','#3B82F6','#10B981','#8B5CF6','#F97316','#EC4899','#14B8A6','#6366F1'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-white rounded-2xl rounded-bl-md shadow-sm w-fit">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const conversationId = params?.conversationId as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [clearedBefore, setClearedBefore] = useState<string | null>(null);

  // Load mute + clear state from localStorage
  useEffect(() => {
    if (!conversationId) return;
    try {
      const muted = JSON.parse(localStorage.getItem('muted_conversations') || '{}');
      setIsMuted(!!muted[conversationId]);
      const cleared = JSON.parse(localStorage.getItem('cleared_conversations') || '{}');
      setClearedBefore(cleared[conversationId] || null);
    } catch { /* ignore */ }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Get current user
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

  // Fetch conversation
  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const fetchConversation = async () => {
      try {
        const supabase = createClient();
        const { data: conv } = await supabase.from('conversations').select('*').eq('id', conversationId).single();
        if (!conv) { setLoading(false); return; }
        const otherId = currentUserId === conv.provider_id ? conv.customer_id : conv.provider_id;
        const { data: profile } = await supabase.from('profiles').select('id, full_name, avatar_url, email, username').eq('id', otherId).maybeSingle();
        let displayName = profile?.full_name || profile?.username || profile?.email || 'User';
        if (otherId === conv.provider_id) {
          const { data: listing } = await supabase.from('listings').select('display_name').eq('user_id', otherId).limit(1).maybeSingle();
          if (listing?.display_name) displayName = listing.display_name;
        }
        setOtherUser({ id: otherId, display_name: displayName, avatar_url: profile?.avatar_url || null });
      } catch (e) { console.error('Error fetching conversation:', e); }
      setLoading(false);
    };
    fetchConversation();
  }, [conversationId, currentUserId]);

  // Fetch messages + realtime
  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const fetchMessages = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
        if (data) {
          setMessages(data);
          fetch('/api/messages/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversation_id: conversationId, user_id: currentUserId }) }).catch(() => {});
        }
      } catch (e) { console.error('Error fetching messages:', e); }
    };
    fetchMessages();

    const rtSupabase = createClient();
    const subscription = rtSupabase.channel(`messages:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
        if ((payload.new as Message).sender_id !== currentUserId) {
          fetch('/api/messages/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversation_id: conversationId, user_id: currentUserId }) }).catch(() => {});
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages(prev => prev.map(m => m.id === (payload.new as Message).id ? { ...m, ...payload.new } : m));
      })
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, [conversationId, currentUserId]);

  // Typing indicator via Supabase Realtime broadcast
  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const supabase = createClient();
    const channel = supabase.channel(`typing:${conversationId}`);

    channel.on('broadcast', { event: 'typing' }, (payload) => {
      if (payload?.payload?.user_id !== currentUserId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, currentUserId]);

  const sendTypingIndicator = useCallback(() => {
    if (!conversationId || !currentUserId) return;
    if (typingTimeoutRef.current) return; // throttle
    const supabase = createClient();
    supabase.channel(`typing:${conversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUserId }
    }).catch(() => {});
    typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 2000);
  }, [conversationId, currentUserId]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) { setUploadError('Only JPG, PNG, GIF and WEBP allowed'); return; }
    if (file.size > MAX_FILE_SIZE) { setUploadError('File too large. Max 10MB'); return; }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/messages/upload', { method: 'POST', body: fd });
      if (!res.ok) { const err = await res.json(); setUploadError(err?.error || 'Upload failed'); return null; }
      return (await res.json()).url;
    } catch { setUploadError('Upload failed'); return null; } finally { setUploading(false); }
  };

  const sendMessage = async () => {
    if ((!messageInput.trim() && !selectedImage) || uploading) return;
    if (!conversationId || !currentUserId) return;
    try {
      let imageUrl: string | null = null;
      if (selectedImage) { imageUrl = await uploadImage(selectedImage); if (!imageUrl && !messageInput.trim()) return; }
      const res = await fetch('/api/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, sender_id: currentUserId, content: messageInput.trim() || null, image_url: imageUrl })
      });
      if (res.ok) { setMessageInput(''); setSelectedImage(null); setPreviewUrl(null); setUploadError(null); }
    } catch (error) { console.error('Error sending message:', error); }
  };

  const onEmojiClick = (emojiData: { emoji: string }) => { setMessageInput(prev => prev + emojiData.emoji); setShowEmojiPicker(false); };

  const toggleMute = () => {
    const muted = JSON.parse(localStorage.getItem('muted_conversations') || '{}');
    if (isMuted) { delete muted[conversationId]; } else { muted[conversationId] = true; }
    localStorage.setItem('muted_conversations', JSON.stringify(muted));
    setIsMuted(!isMuted);
    setShowMenu(false);
  };

  const clearHistory = () => {
    if (!confirm('Clear chat history? Messages will be hidden for you only.')) return;
    const cleared = JSON.parse(localStorage.getItem('cleared_conversations') || '{}');
    cleared[conversationId] = new Date().toISOString();
    localStorage.setItem('cleared_conversations', JSON.stringify(cleared));
    setClearedBefore(cleared[conversationId]);
    setShowMenu(false);
  };

  const blockUser = async () => {
    if (!currentUserId || !otherUser) return;
    try { await fetch('/api/blocked', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: currentUserId, blocked_user_id: otherUser.id }) }); window.location.href = '/messages'; } catch (e) { console.error('Error blocking:', e); }
  };

  const deleteConversation = async () => {
    if (!conversationId || !currentUserId) return;
    if (!confirm('Delete this conversation?')) return;
    try { await fetch('/api/conversations', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversation_id: conversationId, user_id: currentUserId }) }); window.location.href = '/messages'; } catch (e) { console.error('Error deleting:', e); }
  };

  // Filter messages by cleared_before
  const visibleMessages = clearedBefore
    ? messages.filter(m => new Date(m.created_at) > new Date(clearedBefore))
    : messages;

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!otherUser) return <div className="flex items-center justify-center h-screen text-gray-500">Conversation not found</div>;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setLightboxUrl(null)}>
          <button onClick={() => setLightboxUrl(null)} className="absolute top-4 right-4 text-white hover:text-gray-300 z-[101]"><X className="w-8 h-8" /></button>
          <img src={lightboxUrl} alt="Full size" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/messages"><ChevronLeft className="w-5 h-5 cursor-pointer" /></Link>
          <div className="flex items-center gap-2">
            {otherUser.avatar_url ? (
              <img src={otherUser.avatar_url} alt={otherUser.display_name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ backgroundColor: getAvatarColor(otherUser.id) }}>{getInitials(otherUser.display_name)}</div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-semibold">{otherUser.display_name}</h2>
                {isMuted && <BellOff className="w-3.5 h-3.5 text-gray-400" />}
              </div>
              {isTyping && <p className="text-xs text-green-500">typing...</p>}
            </div>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}><MoreVertical className="w-5 h-5" /></button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                <button onClick={toggleMute} className="flex items-center gap-2 w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700">
                  {isMuted ? <><Bell className="w-4 h-4" /> Unmute notifications</> : <><BellOff className="w-4 h-4" /> Mute notifications</>}
                </button>
                <button onClick={clearHistory} className="flex items-center gap-2 w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700">🗑️ Clear history</button>
                <button onClick={() => { setShowMenu(false); blockUser(); }} className="flex items-center gap-2 w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700">🚫 Block user</button>
                <div className="border-t border-gray-100" />
                <button onClick={() => { setShowMenu(false); deleteConversation(); }} className="flex items-center gap-2 w-full text-left px-4 py-2.5 hover:bg-red-50 text-sm text-red-600">❌ Delete chat</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3" style={{ background: '#f0f0f0' }}>
        {visibleMessages.map((msg, i) => {
          const isMe = msg.sender_id === currentUserId;
          const isEmoji = msg.content && !msg.image_url && /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+$/u.test(msg.content) && msg.content.length <= 12;
          const prevMsg = visibleMessages[i - 1];
          const sameSender = prevMsg && prevMsg.sender_id === msg.sender_id;

          // Date separator
          const msgDate = new Date(msg.created_at).toDateString();
          const prevDate = prevMsg ? new Date(prevMsg.created_at).toDateString() : null;
          const showDate = msgDate !== prevDate;

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="bg-white/80 text-gray-500 text-xs px-3 py-1 rounded-full shadow-sm">{formatDateSeparator(msg.created_at)}</span>
                </div>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${sameSender && !showDate ? 'mt-1' : 'mt-3'}`} style={{ marginTop: i === 0 && !showDate ? 0 : undefined }}>
                {!isMe && (
                  <div className="mr-2 flex-shrink-0 self-end" style={{ width: 32 }}>
                    {(!sameSender || showDate) ? (
                      otherUser.avatar_url ? (
                        <img src={otherUser.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: getAvatarColor(otherUser.id) }}>{getInitials(otherUser.display_name)}</div>
                      )
                    ) : null}
                  </div>
                )}
                {isEmoji ? (
                  <div className="flex flex-col items-end">
                    <span className="text-4xl leading-tight">{msg.content}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && <span className="ml-1" style={{ color: msg.read_at ? '#3B82F6' : '#9CA3AF' }}>{msg.read_at ? '✓✓' : '✓'}</span>}
                    </span>
                  </div>
                ) : (
                  <div className={`max-w-[75%] sm:max-w-[65%] px-3 py-2 ${isMe ? 'bg-red-500 text-white rounded-2xl rounded-br-md' : 'bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-sm'}`}>
                    {msg.image_url && (
                      <img src={msg.image_url} alt="attachment" className="rounded-lg cursor-pointer mb-1.5 hover:opacity-90 transition" style={{ maxWidth: 280, maxHeight: 280, objectFit: 'cover' }} onClick={() => setLightboxUrl(msg.image_url!)} />
                    )}
                    {msg.content && <p className="text-[15px] leading-snug break-words whitespace-pre-wrap">{msg.content}</p>}
                    <div className={`text-[10px] flex items-center justify-end gap-1 mt-0.5 ${isMe ? 'text-red-200' : 'text-gray-400'}`}>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && <span style={{ color: msg.read_at ? '#FDE8E8' : 'rgba(255,255,255,0.5)' }}>{msg.read_at ? '✓✓' : '✓'}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start mt-2">
            <div className="mr-2 flex-shrink-0 self-end" style={{ width: 32 }}>
              {otherUser.avatar_url ? (
                <img src={otherUser.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: getAvatarColor(otherUser.id) }}>{getInitials(otherUser.display_name)}</div>
              )}
            </div>
            <TypingIndicator />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        {uploadError && (
          <div className="mb-2 text-xs text-red-500 flex items-center gap-1">
            <span>⚠️ {uploadError}</span>
            <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}
        {previewUrl && (
          <div className="mb-3 relative w-fit">
            <img src={previewUrl} alt="preview" className="max-w-[200px] max-h-[150px] rounded object-cover" />
            <button onClick={() => { setSelectedImage(null); setPreviewUrl(null); setUploadError(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">×</button>
          </div>
        )}
        <div className="flex gap-2 items-end relative">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" id="image-input" onChange={handleImageSelect} />
          <label htmlFor="image-input" className="cursor-pointer text-gray-500 hover:text-gray-700 flex-shrink-0"><Paperclip className="w-5 h-5" /></label>
          <div className="relative flex-shrink-0">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-gray-500 hover:text-gray-700"><Smile className="w-5 h-5" /></button>
            {showEmojiPicker && <div className="absolute bottom-10 left-0 z-50"><EmojiPicker onEmojiClick={onEmojiClick} width={320} height={400} /></div>}
          </div>
          <input
            type="text" value={messageInput}
            onChange={(e) => { setMessageInput(e.target.value); sendTypingIndicator(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
            placeholder="Write a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button onClick={sendMessage} disabled={uploading} className="text-red-500 hover:text-red-600 disabled:opacity-50 flex-shrink-0">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
