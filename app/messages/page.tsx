'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, BellOff, X, Loader2 } from 'lucide-react';

interface OtherUser { id: string; display_name: string; avatar_url?: string | null; }

interface ConversationData {
  id: string; provider_id: string; customer_id: string;
  other_user?: OtherUser;
  last_message?: { content?: string; created_at?: string; sender_id?: string; } | null;
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
  // Show context around match
  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, idx + query.length + 30);
  const before = (start > 0 ? '...' : '') + text.slice(start, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length, end) + (end < text.length ? '...' : '');
  return <>{before}<mark className="bg-yellow-200 text-gray-900 rounded px-0.5">{match}</mark>{after}</>;
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [mutedIds, setMutedIds] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { try { setMutedIds(new Set(Object.keys(JSON.parse(localStorage.getItem('muted_conversations')||'{}')))); } catch {} }, []);

  useEffect(() => {
    const g = async () => { try { const s=createClient(); const{data:{user}}=await s.auth.getUser(); if(user?.id) setCurrentUserId(user.id); } catch(e){console.error(e);} };
    g();
  }, []);

  useEffect(() => {
    if (!currentUserId) { setLoading(false); return; }
    const f = async () => {
      try { const res=await fetch(`/api/conversations/list?user_id=${currentUserId}`); const data=await res.json(); setConversations(data?.conversations||[]); }
      catch(e) { console.error(e); setConversations([]); }
      finally { setLoading(false); }
    };
    f();
    const supabase=createClient();
    const sub=supabase.channel('conversations-list')
      .on('postgres_changes',{event:'*',schema:'public',table:'conversations'},()=>f())
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},()=>f())
      .subscribe();
    return ()=>{sub.unsubscribe();};
  }, [currentUserId]);

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2 || !currentUserId) { setSearchResults([]); setSearching(false); setIsSearchMode(false); return; }
    setSearching(true);
    setIsSearchMode(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&user_id=${currentUserId}`);
      const data = await res.json();
      setSearchResults(data?.results || []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, [currentUserId]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!val || val.length < 2) { setSearchResults([]); setIsSearchMode(false); return; }
    searchTimeoutRef.current = setTimeout(() => doSearch(val), 400);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchMode(false);
  };

  // Filter conversations by name (when not in full search mode)
  const filteredConversations = !isSearchMode
    ? conversations.filter(conv => {
        if (!searchQuery) return true;
        const name = conv.other_user?.display_name?.toLowerCase() || '';
        return name.includes(searchQuery.toLowerCase());
      })
    : conversations;

  // Navigate to message in conversation
  const goToMessage = (conversationId: string, messageId: string) => {
    router.push(`/messages/${conversationId}?highlight=${messageId}`);
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text" value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search conversations & messages..."
            className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {searchQuery && (
            <button onClick={clearSearch} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search results */}
        {isSearchMode ? (
          <div>
            {searching ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Search className="w-8 h-8 mb-2" />
                <p className="text-sm">No messages found for &ldquo;{searchQuery}&rdquo;</p>
              </div>
            ) : (
              <>
                <div className="px-4 py-2 bg-gray-50 border-b">
                  <p className="text-xs text-gray-500 font-medium">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} in messages</p>
                </div>
                <div className="divide-y">
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => goToMessage(r.conversation_id, r.id)}
                      className="flex items-start gap-3 p-4 hover:bg-gray-50 w-full text-left transition"
                    >
                      {/* Avatar */}
                      {r.conversation_avatar ? (
                        <img src={r.conversation_avatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style={{ backgroundColor: getAvatarColor(r.conversation_id) }}>
                          {getInitials(r.conversation_name)}
                        </div>
                      )}
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h3 className="text-sm font-semibold text-gray-900">{r.conversation_name}</h3>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(r.created_at)}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {r.is_own_message && <span className="text-gray-400">You: </span>}
                          <HighlightText text={r.content} query={searchQuery} />
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          /* Normal conversation list */
          filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conv) => {
                const other = conv.other_user;
                const unread = conv.unread_count || 0;
                const msgTime = conv.last_message?.created_at || conv.last_message_at;
                const preview = conv.last_message?.content?.substring(0, 50) || 'No messages yet';

                return (
                  <Link key={conv.id} href={`/messages/${conv.id}`}>
                    <div className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer group">
                      <div className="relative flex-shrink-0">
                        {other?.avatar_url ? (
                          <img src={other.avatar_url} alt={other.display_name||'User'} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{backgroundColor:getAvatarColor(other?.id)}}>{getInitials(other?.display_name)}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm ${unread>0?'font-bold text-black':'font-semibold text-gray-900'} flex items-center gap-1`}>
                          {other?.display_name||'Unknown'}
                          {mutedIds.has(conv.id)&&<BellOff className="w-3 h-3 text-gray-400"/>}
                        </h3>
                        <p className={`text-xs truncate ${unread>0?'font-semibold text-gray-800':'text-gray-500'}`}>{preview}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {msgTime&&<p className={`text-xs ${unread>0?'text-red-500 font-semibold':'text-gray-400'}`}>{timeAgo(msgTime)}</p>}
                        {unread>0&&<span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{unread>99?'99+':unread}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
