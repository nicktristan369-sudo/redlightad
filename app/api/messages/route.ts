import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
    const limit = searchParams.get('limit') || '50';

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversation_id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_id, sender_id, content, image_url } = body;

    if (!conversation_id || !sender_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get conversation to find recipient
    const { data: conv } = await supabase
      .from('conversations')
      .select('provider_id, customer_id')
      .eq('id', conversation_id)
      .single();

    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const recipientId = conv.provider_id === sender_id ? conv.customer_id : conv.provider_id;

    // Check if blocked
    const { data: blocked } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('user_id', recipientId)
      .eq('blocked_user_id', sender_id)
      .maybeSingle();

    if (blocked) {
      return NextResponse.json({ error: 'User has blocked you' }, { status: 403 });
    }

    // Insert message
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id,
        sender_id,
        content: content || null,
        image_url: image_url || null,
        created_at: new Date().toISOString()
      }])
      .select('*')
      .single();

    if (error) throw error;

    // Update conversation
    await supabase
      .from('conversations')
      .update({
        last_message: content || (image_url ? '📷 Image' : ''),
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversation_id);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { message_id, action } = body;

    if (!message_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'mark_as_read') {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', message_id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}
