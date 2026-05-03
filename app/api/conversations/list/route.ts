import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Get conversations for this user (provider or customer)
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`provider_id.eq.${userId},customer_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Conversations error:', error);
      return NextResponse.json({ conversations: [] });
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // Enrich with profile data and last message
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv: any) => {
        const otherId = userId === conv.provider_id ? conv.customer_id : conv.provider_id;

        // Get profile from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, email, username')
          .eq('id', otherId)
          .maybeSingle();

        // Get display name from listings if provider
        let displayName = profile?.full_name || profile?.username || profile?.email || 'User';
        let avatarUrl = profile?.avatar_url || null;

        if (otherId === conv.provider_id) {
          const { data: listing } = await supabase
            .from('listings')
            .select('display_name, title')
            .eq('user_id', otherId)
            .limit(1)
            .maybeSingle();
          if (listing?.display_name) displayName = listing.display_name;
        }

        // Get last message from messages table
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', userId)
          .is('read_at', null);

        return {
          ...conv,
          other_user: {
            id: otherId,
            display_name: displayName,
            avatar_url: avatarUrl,
          },
          last_message: lastMsg ? {
            content: lastMsg.content,
            created_at: lastMsg.created_at,
            sender_id: lastMsg.sender_id,
          } : conv.last_message ? {
            content: conv.last_message,
            created_at: conv.last_message_at,
          } : null,
          unread_count: unreadCount || 0,
        };
      })
    );

    return NextResponse.json({ conversations: enrichedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ conversations: [], error: String(error) });
  }
}
