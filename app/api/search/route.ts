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

    // Search messages in conversations where user is a participant
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const conversationIds = conversations.map(c => c.id);

    // Search in messages
    const { data: messages } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        conversation_id,
        sender_id,
        created_at,
        sender:sender_id(id, username, profile_picture_url, first_name, last_name),
        conversation:conversation_id(id, user1_id, user2_id, user1:user1_id(username), user2:user2_id(username))
      `)
      .in('conversation_id', conversationIds)
      .ilike('content', searchTerm)
      .order('created_at', { ascending: false })
      .limit(20);

    // Enrich results with conversation partner info
    const results = (messages || []).map(msg => {
      const conv = msg.conversation as any;
      const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1;
      
      return {
        id: msg.id,
        content: msg.content,
        conversation_id: msg.conversation_id,
        sender: msg.sender,
        other_user: otherUser,
        created_at: msg.created_at,
        snippet: msg.content?.substring(0, 100) || '...'
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching messages:', error);
    return NextResponse.json({ error: 'Failed to search messages' }, { status: 500 });
  }
}
