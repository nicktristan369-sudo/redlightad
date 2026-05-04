import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const userId = searchParams.get('user_id');

    if (!query || !userId) {
      return NextResponse.json({ error: 'Missing query or user_id' }, { status: 400 });
    }

    const searchTerm = `%${query.toLowerCase()}%`;

    // Get all conversations for this user
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, provider_id, customer_id')
      .or(`provider_id.eq.${userId},customer_id.eq.${userId}`);

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const conversationIds = conversations.map(c => c.id);

    // Build a map of conversation → other user id
    const convMap = new Map<string, string>();
    for (const c of conversations) {
      convMap.set(c.id, c.provider_id === userId ? c.customer_id : c.provider_id);
    }

    // Search messages by content
    const { data: messages } = await supabase
      .from('messages')
      .select('id, content, conversation_id, sender_id, created_at')
      .in('conversation_id', conversationIds)
      .ilike('content', searchTerm)
      .order('created_at', { ascending: false })
      .limit(30);

    // Get unique other user ids for display names
    const otherUserIds = [...new Set(conversations.map(c => c.provider_id === userId ? c.customer_id : c.provider_id))];

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, username, email')
      .in('id', otherUserIds);

    // Fetch listing display names for providers
    const providerIds = conversations.filter(c => c.provider_id !== userId).map(c => c.provider_id);
    const { data: listings } = providerIds.length > 0
      ? await supabase.from('listings').select('user_id, display_name').in('user_id', providerIds)
      : { data: [] };

    // Build display name map
    const nameMap = new Map<string, { display_name: string; avatar_url: string | null }>();
    for (const p of profiles || []) {
      nameMap.set(p.id, {
        display_name: p.full_name || p.username || p.email || 'User',
        avatar_url: p.avatar_url || null,
      });
    }
    for (const l of listings || []) {
      if (l.display_name) {
        const existing = nameMap.get(l.user_id);
        if (existing) existing.display_name = l.display_name;
      }
    }

    const results = (messages || []).map(msg => {
      const otherId = convMap.get(msg.conversation_id) || '';
      const otherInfo = nameMap.get(otherId);
      return {
        id: msg.id,
        content: msg.content,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        created_at: msg.created_at,
        conversation_name: otherInfo?.display_name || 'User',
        conversation_avatar: otherInfo?.avatar_url || null,
        is_own_message: msg.sender_id === userId,
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching messages:', error);
    return NextResponse.json({ error: 'Failed to search messages' }, { status: 500 });
  }
}
