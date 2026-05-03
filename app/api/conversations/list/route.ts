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

    // Enrich with user data
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv: any) => {
        const otherId = userId === conv.provider_id ? conv.customer_id : conv.provider_id;

        // Try to get user from users table
        const { data: otherUser } = await supabase
          .from('users')
          .select('id, username, profile_picture_url, first_name, last_name')
          .eq('id', otherId)
          .maybeSingle();

        // Try to get last message
        const { data: lastMsg } = await supabase
          .from('conversation_messages')
          .select('message, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...conv,
          other_user: otherUser || { id: otherId, username: 'User', first_name: 'User', last_name: '' },
          last_message: lastMsg
        };
      })
    );

    return NextResponse.json({ conversations: enrichedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ conversations: [], error: String(error) });
  }
}
