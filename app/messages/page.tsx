'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, BellOff, Bell, X, Loader2, MoreVertical } from 'lucide-react';

interface OtherUser { id: string; display_name: string; avatar_url?: string | null; is_online?: boolean; }

interface ConversationData {
  id: string; provider_id: string; customer_id: string;
  other_user?: OtherUser;
  last_message?: { content?: string; created_at?: string; sender_id?: string; read_at?: string; } | null;
  last_message_at?: string; unread_count?: number;
}

interface SearchResult {
  id: string; content: string; conversation_id: string; sender_id: string;
  created_at: string; conversation_name: string; conversation_avatar: string | null;
  is_own_message: boolean;
}

const AVATAR_COLORS = ['#EF4444','#3B82F6','#10B981','#8B5CF6','#F97316','#EC4899','#14B8A6','#6366F1'];
function getAvatarColor(id?: string) { if (!id) return AVATAR_COLORS[0]; let h=0; for(let i=0;i<id.length;i++) h=id.charCodeAt(i)+((h<<5)-h); return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length]; }
function getInitials(name?: string) { if(!name) return '?'; const p=name.trim().split(/\s+/); if(p.length>=2) return (p[0][0]+p[p.length-1][0]).toUpperCase(); return name[0]?.toUpperCase()||'?'; }
function timeAgo(dateStr?: string|null) { if(!dateStr) return ''; const diff=Date.now()-new Date(dateStr).getTime(); const mins=Math.floor(diff/60000); if(mins<1) return 'now'; if(mins<60) return `${mins}m`; const hrs=Math.floor(mins/60); if(hrs<24) return `${hrs}h`; return `${Math.floor(hrs/24)}d`; }

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || query.length < 2) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, idx + query.length + 30);
  return <>{(start > 0 ? '...' : '') + text.slice(start, idx)}<mark className="bg-yellow-200 text-gray-900 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>{text.slice(idx + query.length, end) + (end < text.length ? '...' : '')}</>;
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [mutedIds, setMutedIds] = useState<Record<string, boolean>>({});
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [convMenu, setConvMenu] = useState<{ convId: string; x: number; y: number } | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { try { setMutedIds(JSON.parse(localStorage.getItem('muted_conversations')||'{}')); } catch {} }, []);

  useEffect(() => { const g = async () => { try { const s=createClient(); const{data:{user}}=await s.auth.getUser(); if(user?.id) setCurrentUserId(user.id); } catch(e){console.error(e);} }; g(); }, []);

  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return;
    try { const res=await fetch(`/api/conversations/list?user_id=${currentUserId}`); const data=await res.json(); setConversations(data?.conversations||[]); }
    catch(e) { console.error(e); setConversations([]); }
    finally { setLoading(false); }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) { setLoading(false); return; }
    fetchConversations();
    const supabase=createClient();
    const sub=supabase.channel('conversations-list')
      .on('postgres_changes',{event:'*',schema:'public',table:'conversations'},()=>fetchConversations())
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},()=>fetchConversations())
      .subscribe();
    return ()=>{sub.unsubscribe();};
  }, [currentUserId, fetchConversations]);

  // Update own online status
  useEffect(() => {
    if (!currentUserId) return;
    const update = () => { fetch('/api/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: currentUserId }) }).catch(() => {}); };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  const doSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2 || !currentUserId) { setSearchResults([]); setSearching(false); setIsSearchMode(false); return; }
    setSearching(true); setIsSearchMode(true);
    try { const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&user_id=${currentUserId}`); setSearchResults((await res.json())?.results || []); }
    catch { setSearchResults([]); } finally { setSearching(false); }
  }, [currentUserId]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!val || val.length < 2) { setSearchResults([]); setIsSearchMode(false); return; }
    searchTimeoutRef.current = setTimeout(() => doSearch(val), 400);
  };

  const clearSearch = () => { setSearchQuery(''); setSearchResults([]); setIsSearchMode(false); };

  // Conversation menu actions
  const toggleMuteConv = (convId: string) => {
    const m = { ...mutedIds };
    if (m[convId]) delete m[convId]; else m[convId] = true;
    localStorage.setItem('muted_conversations', JSON.stringify(m));
    setMutedIds(m);
    setConvMenu(null);
  };

  const deleteConv = async (convId: string) => {
    if (!currentUserId || !confirm('Delete this conversation?')) { setConvMenu(null); return; }
    try { await fetch('/api/conversations', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversation_id: convId, user_id: currentUserId }) }); fetchConversations(); }
    catch (e) { console.error(e); }
    setConvMenu(null);
  };

  const blockFromConv = async (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (!currentUserId || !conv?.other_user || !confirm(`Block ${conv.other_user.display_name}?`)) { setConvMenu(null); return; }
    try { await fetch('/api/blocked', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: currentUserId, blocked_user_id: conv.other_user.id }) }); fetchConversations(); }
    catch (e) { console.error(e); }
    setConvMenu(null);
  };

  const filteredConversations = !isSearchMode
    ? conversations.filter(conv => { if (!searchQuery) return true; return (conv.other_user?.display_name?.toLowerCase()||'').includes(searchQuery.toLowerCase()); })
    : conversations;

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Conversation context menu */}
      {convMenu && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setConvMenu(null)} />
          <div className="fixed z-[91] bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-48" style={{ left: Math.min(convMenu.x, (typeof window !== 'undefined' ? window.innerWidth : 400) - 200), top: Math.min(convMenu.y, (typeof window !== 'undefined' ? window.innerHeight : 600) - 160) }}>
            <button onClick={() => toggleMuteConv(convMenu.convId)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700">
              {mutedIds[convMenu.convId] ? <><Bell className="w-4 h-4" /> Unmute</> : <><BellOff className="w-4 h-4" /> Mute</>}
            </button>
            <button onClick={() => blockFromConv(convMenu.convId)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700">🚫 Block user</button>
            <div className="border-t border-gray-100" />
            <button onClick={() => deleteConv(convMenu.convId)} className="flex items-center gap-2 w-full text-left px-4 py-2.5 hover:bg-red-50 text-sm text-red-600">❌ Delete chat</button>
          </div>
        </>
      )}

      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Search conversations & messages..." className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
          {searchQuery && <button onClick={clearSearch} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isSearchMode ? (
          <div>
            {searching ? <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            : searchResults.length === 0 ? <div className="flex flex-col items-center justify-center py-12 text-gray-400"><Search className="w-8 h-8 mb-2" /><p className="text-sm">No messages found for &ldquo;{searchQuery}&rdquo;</p></div>
            : (
              <>
                <div className="px-4 py-2 bg-gray-50 border-b"><p className="text-xs text-gray-500 font-medium">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p></div>
                <div className="divide-y">
                  {searchResults.map((r) => (
                    <button key={r.id} onClick={() => router.push(`/messages/${r.conversation_id}?highlight=${r.id}`)} className="flex items-start gap-3 p-4 hover:bg-gray-50 w-full text-left transition">
                      {r.conversation_avatar ? <img src={r.conversation_avatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{backgroundColor:getAvatarColor(r.conversation_id)}}>{getInitials(r.conversation_name)}</div>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5"><h3 className="text-sm font-semibold text-gray-900">{r.conversation_name}</h3><span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(r.created_at)}</span></div>
                        <p className="text-xs text-gray-600 leading-relaxed">{r.is_own_message && <span className="text-gray-400">You: </span>}<HighlightText text={r.content} query={searchQuery} /></p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">{searchQuery ? 'No conversations found' : 'No messages yet'}</div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conv) => {
              const other = conv.other_user;
              const unread = conv.unread_count || 0;
              const msgTime = conv.last_message?.created_at || conv.last_message_at;
              const preview = conv.last_message?.content?.substring(0, 50) || 'No messages yet';
              const isSentByMe = conv.last_message?.sender_id === currentUserId;
              const isRead = !!conv.last_message?.read_at;

              return (
                <div key={conv.id} className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer group relative">
                  <Link href={`/messages/${conv.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar with online dot */}
                    <div className="relative flex-shrink-0">
                      {other?.avatar_url ? (
                        <img src={other.avatar_url} alt={other.display_name||'User'} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{backgroundColor:getAvatarColor(other?.id)}}>{getInitials(other?.display_name)}</div>
                      )}
                      {other?.is_online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm ${unread>0?'font-bold text-black':'font-semibold text-gray-900'} flex items-center gap-1`}>
                        {other?.display_name||'Unknown'}
                        {mutedIds[conv.id]&&<BellOff className="w-3 h-3 text-gray-400"/>}
                      </h3>
                      <p className={`text-xs truncate flex items-center gap-1 ${unread>0?'font-semibold text-gray-800':'text-gray-500'}`}>
                        {isSentByMe && (
                          <span className={`flex-shrink-0 ${isRead ? 'text-blue-500' : 'text-gray-400'}`}>
                            {isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                        <span className="truncate">{preview}</span>
                      </p>
                    </div>

                    {/* Time + badge */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {msgTime&&<p className={`text-xs ${unread>0?'text-red-500 font-semibold':'text-gray-400'}`}>{timeAgo(msgTime)}</p>}
                      {unread>0&&<span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{unread>99?'99+':unread}</span>}
                    </div>
                  </Link>

                  {/* ⋮ Menu button */}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); const rect = (e.target as HTMLElement).getBoundingClientRect(); setConvMenu({ convId: conv.id, x: rect.right - 192, y: rect.bottom + 4 }); }}
                    className="opacity-0 group-hover:opacity-100 transition flex-shrink-0 p-1 hover:bg-gray-200 rounded"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
