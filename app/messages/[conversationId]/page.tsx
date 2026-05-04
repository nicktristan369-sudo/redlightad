'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { ChevronLeft, MoreVertical, Paperclip, Smile, Send, X, Loader2, BellOff, Bell, Reply, Pin, PinOff } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });
const SUGGESTION_NONE = 'none' as const;

interface Message { id: string; sender_id: string; content?: string; image_url?: string; created_at: string; read_at?: string; reply_to_id?: string; }
interface OtherUser { id: string; display_name: string; avatar_url?: string | null; }
interface PinnedMsg { messageId: string; pinnedAt: string; }

const AVATAR_COLORS = ['#EF4444','#3B82F6','#10B981','#8B5CF6','#F97316','#EC4899','#14B8A6','#6366F1'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg','image/png','image/gif','image/webp'];

function getAvatarColor(id?: string) { if (!id) return AVATAR_COLORS[0]; let h=0; for (let i=0;i<id.length;i++) h=id.charCodeAt(i)+((h<<5)-h); return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length]; }
function getInitials(name?: string) { if (!name) return '?'; const p=name.trim().split(/\s+/); if (p.length>=2) return (p[0][0]+p[p.length-1][0]).toUpperCase(); return name[0]?.toUpperCase()||'?'; }
function formatDateSep(d: string) { const dt=new Date(d),now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate()),md=new Date(dt.getFullYear(),dt.getMonth(),dt.getDate()),diff=Math.floor((today.getTime()-md.getTime())/86400000); if(diff===0) return 'Today'; if(diff===1) return 'Yesterday'; return dt.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}); }
function TypingDots() { return <div className="flex items-center gap-1 px-3 py-2 bg-white rounded-2xl rounded-bl-md shadow-sm w-fit"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/></div>; }

function getPinnedMessages(convId: string): PinnedMsg[] { try { return JSON.parse(localStorage.getItem(`pins_${convId}`) || '[]'); } catch { return []; } }
function setPinnedMessages(convId: string, pins: PinnedMsg[]) { localStorage.setItem(`pins_${convId}`, JSON.stringify(pins)); }

export default function ChatPage() {
  const params = useParams();
  const searchParamsObj = useSearchParams();
  const conversationId = params?.conversationId as string;
  const highlightId = searchParamsObj?.get('highlight') || null;
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
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [pinnedMsgs, setPinnedMsgs] = useState<PinnedMsg[]>([]);
  const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  // Load local state
  useEffect(() => {
    if (!conversationId) return;
    try {
      const m = JSON.parse(localStorage.getItem('muted_conversations') || '{}'); setIsMuted(!!m[conversationId]);
      const c = JSON.parse(localStorage.getItem('cleared_conversations') || '{}'); setClearedBefore(c[conversationId] || null);
      setPinnedMsgs(getPinnedMessages(conversationId));
    } catch {}
  }, [conversationId]);

  // Scroll to highlighted message or bottom
  useEffect(() => {
    if (highlightId && messages.length > 0 && !highlightedMsgId) {
      const el = document.getElementById(`msg-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedMsgId(highlightId);
        setTimeout(() => setHighlightedMsgId(null), 3000);
        return;
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, highlightId, highlightedMsgId]);

  useEffect(() => { const g = async () => { try { const s=createClient(); const{data:{user}}=await s.auth.getUser(); if(user?.id) setCurrentUserId(user.id); } catch(e){ console.error(e); } }; g(); }, []);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const f = async () => { try { const s=createClient(); const{data:conv}=await s.from('conversations').select('*').eq('id',conversationId).single(); if(!conv){setLoading(false);return;} const otherId=currentUserId===conv.provider_id?conv.customer_id:conv.provider_id; const{data:profile}=await s.from('profiles').select('id,full_name,avatar_url,email,username').eq('id',otherId).maybeSingle(); let dn=profile?.full_name||profile?.username||profile?.email||'User'; let avatarUrl=profile?.avatar_url||null; const{data:listing}=await s.from('listings').select('display_name,profile_image').eq('user_id',otherId).limit(1).maybeSingle(); if(listing?.display_name) dn=listing.display_name; if(listing?.profile_image&&!avatarUrl) avatarUrl=listing.profile_image; setOtherUser({id:otherId,display_name:dn,avatar_url:avatarUrl}); } catch(e){console.error(e);} setLoading(false); }; f();
  }, [conversationId, currentUserId]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const f = async () => { try { const s=createClient(); const{data}=await s.from('messages').select('*').eq('conversation_id',conversationId).order('created_at',{ascending:true}); if(data){setMessages(data); fetch('/api/messages/read',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({conversation_id:conversationId,user_id:currentUserId})}).catch(()=>{});} } catch(e){console.error(e);} };
    f();
    const rt=createClient(); const sub=rt.channel(`messages:${conversationId}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:`conversation_id=eq.${conversationId}`},(p)=>{setMessages(prev=>[...prev,p.new as Message]); if((p.new as Message).sender_id!==currentUserId) fetch('/api/messages/read',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({conversation_id:conversationId,user_id:currentUserId})}).catch(()=>{});})
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'messages',filter:`conversation_id=eq.${conversationId}`},(p)=>{setMessages(prev=>prev.map(m=>m.id===(p.new as Message).id?{...m,...p.new}:m));})
      .subscribe();
    return ()=>{sub.unsubscribe();};
  }, [conversationId, currentUserId]);

  // Check other user online status
  useEffect(() => {
    if (!otherUser?.id) return;
    const checkOnline = async () => {
      try { const res=await fetch(`/api/status?user_id=${otherUser.id}`); if(res.ok){const d=await res.json(); setOtherOnline(d?.online??false);} } catch{setOtherOnline(false);}
    };
    checkOnline();
    const interval=setInterval(checkOnline, 15000);
    return ()=>clearInterval(interval);
  }, [otherUser?.id]);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;
    const s=createClient(); const ch=s.channel(`typing:${conversationId}`);
    ch.on('broadcast',{event:'typing'},(p)=>{if(p?.payload?.user_id!==currentUserId){setIsTyping(true);setTimeout(()=>setIsTyping(false),3000);}}).subscribe();
    return ()=>{s.removeChannel(ch);};
  }, [conversationId, currentUserId]);

  const sendTypingIndicator = useCallback(() => {
    if (!conversationId||!currentUserId||typingTimeoutRef.current) return;
    createClient().channel(`typing:${conversationId}`).send({type:'broadcast',event:'typing',payload:{user_id:currentUserId}}).catch(()=>{});
    typingTimeoutRef.current=setTimeout(()=>{typingTimeoutRef.current=null;},2000);
  }, [conversationId, currentUserId]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file=e.target.files?.[0]; setUploadError(null); if(!file) return;
    if(!ALLOWED_TYPES.includes(file.type)){setUploadError('Only JPG, PNG, GIF and WEBP');return;} if(file.size>MAX_FILE_SIZE){setUploadError('Max 10MB');return;}
    setSelectedImage(file); const r=new FileReader(); r.onloadend=()=>setPreviewUrl(r.result as string); r.readAsDataURL(file);
    if(fileInputRef.current) fileInputRef.current.value='';
  }, []);

  const uploadImage = async (file: File): Promise<string|null> => {
    setUploading(true); try { const fd=new FormData();fd.append('file',file); const res=await fetch('/api/messages/upload',{method:'POST',body:fd}); if(!res.ok){setUploadError((await res.json())?.error||'Upload failed');return null;} return(await res.json()).url; } catch{setUploadError('Upload failed');return null;} finally{setUploading(false);}
  };

  const sendMessage = async () => {
    if((!messageInput.trim()&&!selectedImage)||uploading) return;
    if(!conversationId||!currentUserId) return;
    try {
      let imageUrl:string|null=null;
      if(selectedImage){imageUrl=await uploadImage(selectedImage); if(!imageUrl&&!messageInput.trim()) return;}

      // Build content with reply metadata if replying
      let content = messageInput.trim() || null;
      const bodyData: Record<string, unknown> = {
        conversation_id: conversationId, sender_id: currentUserId,
        content, image_url: imageUrl
      };

      // Try to include reply_to_id (will be ignored if column doesn't exist yet)
      if (replyTo) {
        bodyData.reply_to_id = replyTo.id;
        // Also embed reply context in content as fallback
        const replyPreview = replyTo.content?.substring(0, 60) || (replyTo.image_url ? '📷 Image' : '');
        bodyData.content = content;
        bodyData.reply_context = JSON.stringify({ id: replyTo.id, preview: replyPreview, sender_id: replyTo.sender_id });
      }

      const res = await fetch('/api/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(bodyData)});
      if(res.ok){setMessageInput('');setSelectedImage(null);setPreviewUrl(null);setUploadError(null);setReplyTo(null);}
    } catch(e){console.error(e);}
  };

  const onEmojiClick = (d:{emoji:string}) => {setMessageInput(p=>p+d.emoji);setShowEmojiPicker(false);};

  const toggleMute = () => { const m=JSON.parse(localStorage.getItem('muted_conversations')||'{}'); if(isMuted) delete m[conversationId]; else m[conversationId]=true; localStorage.setItem('muted_conversations',JSON.stringify(m)); setIsMuted(!isMuted); setShowMenu(false); };
  const clearHistory = () => { if(!confirm('Clear chat history? Hidden for you only.')) return; const c=JSON.parse(localStorage.getItem('cleared_conversations')||'{}'); c[conversationId]=new Date().toISOString(); localStorage.setItem('cleared_conversations',JSON.stringify(c)); setClearedBefore(c[conversationId]); setShowMenu(false); };
  const blockUser = async () => { if(!currentUserId||!otherUser) return; try{await fetch('/api/blocked',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:currentUserId,blocked_user_id:otherUser.id})});window.location.href='/messages';}catch(e){console.error(e);} };
  const deleteConversation = async () => { if(!conversationId||!currentUserId||!confirm('Delete?')) return; try{await fetch('/api/conversations',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({conversation_id:conversationId,user_id:currentUserId})});window.location.href='/messages';}catch(e){console.error(e);} };

  const pinMessage = (msgId: string) => {
    const pins = getPinnedMessages(conversationId);
    if (pins.length >= 3) { alert('Max 3 pinned messages'); setContextMenu(null); return; }
    if (pins.some(p => p.messageId === msgId)) { setContextMenu(null); return; }
    const newPins = [...pins, { messageId: msgId, pinnedAt: new Date().toISOString() }];
    setPinnedMessages(conversationId, newPins);
    setPinnedMsgs(newPins);
    setContextMenu(null);
  };

  const unpinMessage = (msgId: string) => {
    const newPins = pinnedMsgs.filter(p => p.messageId !== msgId);
    setPinnedMessages(conversationId, newPins);
    setPinnedMsgs(newPins);
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent, msg: Message) => {
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setContextMenu({ msg, x: rect.left, y: rect.bottom });
  };

  // Long press for mobile
  const longPressRef = useRef<NodeJS.Timeout | null>(null);
  const handleTouchStart = (msg: Message) => (e: React.TouchEvent) => {
    longPressRef.current = setTimeout(() => {
      const touch = e.touches[0];
      setContextMenu({ msg, x: touch.clientX, y: touch.clientY });
    }, 500);
  };
  const handleTouchEnd = () => { if (longPressRef.current) clearTimeout(longPressRef.current); };

  const visibleMessages = clearedBefore ? messages.filter(m => new Date(m.created_at) > new Date(clearedBefore)) : messages;
  const pinnedMessageObjs = pinnedMsgs.map(p => messages.find(m => m.id === p.messageId)).filter(Boolean) as Message[];

  const getReplyPreview = (msg: Message): { preview: string; senderName: string } | null => {
    // Check if this message has reply_to_id
    if (!msg.reply_to_id) return null;
    const repliedTo = messages.find(m => m.id === msg.reply_to_id);
    if (!repliedTo) return null;
    const preview = repliedTo.content?.substring(0, 60) || (repliedTo.image_url ? '📷 Image' : '...');
    const senderName = repliedTo.sender_id === currentUserId ? 'You' : (otherUser?.display_name || 'User');
    return { preview, senderName };
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!otherUser) return <div className="flex items-center justify-center h-screen text-gray-500">Conversation not found</div>;

  return (
    <div className="flex flex-col h-screen bg-white">
      {lightboxUrl && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={()=>setLightboxUrl(null)}><button onClick={()=>setLightboxUrl(null)} className="absolute top-4 right-4 text-white hover:text-gray-300 z-[101]"><X className="w-8 h-8"/></button><img src={lightboxUrl} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" onClick={e=>e.stopPropagation()}/></div>}

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setContextMenu(null)} />
          <div className="fixed z-[91] bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-44" style={{ left: Math.min(contextMenu.x, window.innerWidth - 180), top: Math.min(contextMenu.y, window.innerHeight - 150) }}>
            <button onClick={() => { setReplyTo(contextMenu.msg); setContextMenu(null); }} className="flex items-center gap-2 w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm"><Reply className="w-4 h-4" /> Reply</button>
            {pinnedMsgs.some(p => p.messageId === contextMenu.msg.id) ? (
              <button onClick={() => unpinMessage(contextMenu.msg.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm"><PinOff className="w-4 h-4" /> Unpin</button>
            ) : (
              <button onClick={() => pinMessage(contextMenu.msg.id)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm"><Pin className="w-4 h-4" /> Pin message</button>
            )}
          </div>
        </>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Link href="/messages"><ChevronLeft className="w-5 h-5 cursor-pointer"/></Link>
          <div className="flex items-center gap-2">
            <div className="relative">
              {otherUser.avatar_url ? <img src={otherUser.avatar_url} alt={otherUser.display_name} className="w-10 h-10 rounded-full object-cover"/> : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{backgroundColor:getAvatarColor(otherUser.id)}}>{getInitials(otherUser.display_name)}</div>}
              {otherOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"/>}
            </div>
            <div>
              <div className="flex items-center gap-1.5"><h2 className="font-semibold">{otherUser.display_name}</h2>{isMuted&&<BellOff className="w-3.5 h-3.5 text-gray-400"/>}</div>
              {isTyping ? <p className="text-xs text-green-500">typing...</p> : otherOnline ? <p className="text-xs text-green-500">Online</p> : null}
            </div>
          </div>
        </div>
        <div className="relative">
          <button onClick={()=>setShowMenu(!showMenu)}><MoreVertical className="w-5 h-5"/></button>
          {showMenu&&(<><div className="fixed inset-0 z-40" onClick={()=>setShowMenu(false)}/><div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1">
            {pinnedMessageObjs.length > 0 && <button onClick={() => { setShowPinnedPanel(!showPinnedPanel); setShowMenu(false); }} className="flex items-center gap-2 w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700">📌 Pinned ({pinnedMessageObjs.length})</button>}
            <button onClick={toggleMute} className="flex items-center gap-2 w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700">{isMuted?<><Bell className="w-4 h-4"/>Unmute</>:<><BellOff className="w-4 h-4"/>Mute</>}</button>
            <button onClick={clearHistory} className="flex items-center gap-2 w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700">🗑️ Clear history</button>
            <button onClick={()=>{setShowMenu(false);blockUser();}} className="flex items-center gap-2 w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700">🚫 Block user</button>
            <div className="border-t border-gray-100"/><button onClick={()=>{setShowMenu(false);deleteConversation();}} className="flex items-center gap-2 w-full text-left px-4 py-2.5 hover:bg-red-50 text-sm text-red-600">❌ Delete chat</button>
          </div></>)}
        </div>
      </div>

      {/* Pinned messages bar */}
      {pinnedMessageObjs.length > 0 && showPinnedPanel && (
        <div className="border-b bg-amber-50 px-4 py-2 max-h-36 overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-amber-700">📌 Pinned Messages</span>
            <button onClick={() => setShowPinnedPanel(false)} className="text-amber-500 hover:text-amber-700"><X className="w-4 h-4" /></button>
          </div>
          {pinnedMessageObjs.map(pm => (
            <div key={pm.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5 mb-1 border border-amber-200">
              <p className="text-xs text-gray-700 truncate flex-1">{pm.content || '📷 Image'}</p>
              <button onClick={() => unpinMessage(pm.id)} className="ml-2 text-gray-400 hover:text-red-500"><PinOff className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      {/* Pinned indicator (collapsed) */}
      {pinnedMessageObjs.length > 0 && !showPinnedPanel && (
        <button onClick={() => setShowPinnedPanel(true)} className="border-b bg-amber-50 px-4 py-1.5 flex items-center gap-2 text-xs text-amber-700 hover:bg-amber-100 transition">
          📌 {pinnedMessageObjs.length} pinned message{pinnedMessageObjs.length > 1 ? 's' : ''}
        </button>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3" style={{background:'#f0f0f0'}}>
        {visibleMessages.map((msg, i) => {
          const isMe = msg.sender_id === currentUserId;
          const isEmoji = msg.content && !msg.image_url && /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+$/u.test(msg.content) && msg.content.length <= 12;
          const prev = visibleMessages[i-1];
          const sameSender = prev && prev.sender_id === msg.sender_id;
          const msgDate = new Date(msg.created_at).toDateString();
          const prevDate = prev ? new Date(prev.created_at).toDateString() : null;
          const showDate = msgDate !== prevDate;
          const isPinned = pinnedMsgs.some(p => p.messageId === msg.id);
          const replyInfo = getReplyPreview(msg);

          return (
            <div key={msg.id} id={`msg-${msg.id}`}>
              {showDate && <div className="flex justify-center my-3"><span className="bg-white/80 text-gray-500 text-xs px-3 py-1 rounded-full shadow-sm">{formatDateSep(msg.created_at)}</span></div>}
              <div className={`flex ${isMe?'justify-end':'justify-start'} ${sameSender&&!showDate?'mt-1':'mt-3'} ${highlightedMsgId===msg.id?'animate-pulse':''}`} style={{marginTop:i===0&&!showDate?0:undefined}}>
                {!isMe && <div className="mr-2 flex-shrink-0 self-end" style={{width:32}}>{(!sameSender||showDate)?(otherUser.avatar_url?<img src={otherUser.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover"/>:<div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{backgroundColor:getAvatarColor(otherUser.id)}}>{getInitials(otherUser.display_name)}</div>):null}</div>}
                {isEmoji ? (
                  <div className="flex flex-col items-end" onContextMenu={(e)=>handleContextMenu(e,msg)} onTouchStart={handleTouchStart(msg)} onTouchEnd={handleTouchEnd}>
                    {isPinned && <span className="text-[10px] text-amber-600 mb-0.5">📌</span>}
                    <span className="text-4xl leading-tight cursor-default">{msg.content}</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">{new Date(msg.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}{isMe&&<span className="ml-1" style={{color:msg.read_at?'#3B82F6':'#9CA3AF'}}>{msg.read_at?'✓✓':'✓'}</span>}</span>
                  </div>
                ) : (
                  <div
                    className={`max-w-[75%] sm:max-w-[65%] px-3 py-2 cursor-default ${isMe?'bg-red-500 text-white rounded-2xl rounded-br-md':'bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-sm'} ${highlightedMsgId===msg.id?'ring-2 ring-yellow-400 ring-offset-2':''}`}
                    onContextMenu={(e)=>handleContextMenu(e,msg)}
                    onTouchStart={handleTouchStart(msg)}
                    onTouchEnd={handleTouchEnd}
                  >
                    {isPinned && <div className="text-[10px] mb-1 opacity-70">📌 Pinned</div>}
                    {replyInfo && (
                      <div className={`mb-1.5 px-2 py-1 rounded-md border-l-2 ${isMe ? 'bg-red-400/30 border-white/50' : 'bg-gray-100 border-gray-400'}`}>
                        <p className={`text-[10px] font-semibold ${isMe ? 'text-red-100' : 'text-gray-500'}`}>{replyInfo.senderName}</p>
                        <p className={`text-[11px] truncate ${isMe ? 'text-red-100' : 'text-gray-500'}`}>{replyInfo.preview}</p>
                      </div>
                    )}
                    {msg.image_url && <img src={msg.image_url} alt="attachment" className="rounded-lg cursor-pointer mb-1.5 hover:opacity-90 transition" style={{maxWidth:280,maxHeight:280,objectFit:'cover'}} onClick={()=>setLightboxUrl(msg.image_url!)}/>}
                    {msg.content && <p className="text-[15px] leading-snug break-words whitespace-pre-wrap">{msg.content}</p>}
                    <div className={`text-[10px] flex items-center justify-end gap-1 mt-0.5 ${isMe?'text-red-200':'text-gray-400'}`}>
                      <span>{new Date(msg.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                      {isMe&&<span style={{color:msg.read_at?'#FDE8E8':'rgba(255,255,255,0.5)'}}>{msg.read_at?'✓✓':'✓'}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isTyping && <div className="flex justify-start mt-2"><div className="mr-2 flex-shrink-0 self-end" style={{width:32}}>{otherUser.avatar_url?<img src={otherUser.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover"/>:<div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{backgroundColor:getAvatarColor(otherUser.id)}}>{getInitials(otherUser.display_name)}</div>}</div><TypingDots/></div>}
        <div ref={messagesEndRef}/>
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        {uploadError && <div className="mb-2 text-xs text-red-500 flex items-center gap-1"><span>⚠️ {uploadError}</span><button onClick={()=>setUploadError(null)} className="text-red-400 hover:text-red-600">✕</button></div>}
        {/* Reply preview */}
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 border-l-4 border-red-500">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-red-500">{replyTo.sender_id === currentUserId ? 'You' : otherUser.display_name}</p>
              <p className="text-xs text-gray-600 truncate">{replyTo.content || '📷 Image'}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X className="w-4 h-4" /></button>
          </div>
        )}
        {previewUrl && <div className="mb-3 relative w-fit"><img src={previewUrl} alt="preview" className="max-w-[200px] max-h-[150px] rounded object-cover"/><button onClick={()=>{setSelectedImage(null);setPreviewUrl(null);setUploadError(null);}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">×</button></div>}
        <div className="flex gap-2 items-end relative">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" id="image-input" onChange={handleImageSelect}/>
          <label htmlFor="image-input" className="cursor-pointer text-gray-500 hover:text-gray-700 flex-shrink-0"><Paperclip className="w-5 h-5"/></label>
          <div className="relative flex-shrink-0"><button onClick={()=>setShowEmojiPicker(!showEmojiPicker)} className="text-gray-500 hover:text-gray-700"><Smile className="w-5 h-5"/></button>{showEmojiPicker&&<div className="absolute bottom-10 left-0 z-50"><EmojiPicker onEmojiClick={onEmojiClick} width={320} height={400} suggestedEmojisMode={SUGGESTION_NONE as any} searchPlaceholder="Search emoji..."/></div>}</div>
          <input type="text" value={messageInput} onChange={e=>{setMessageInput(e.target.value);sendTypingIndicator();}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="Write a message..." className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"/>
          <button onClick={sendMessage} disabled={uploading} className="text-red-500 hover:text-red-600 disabled:opacity-50 flex-shrink-0">{uploading?<Loader2 className="w-5 h-5 animate-spin"/>:<Send className="w-5 h-5"/>}</button>
        </div>
      </div>
    </div>
  );
}
