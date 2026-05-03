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
      .select(`
        *,
        sender:sender_id(id, username, profile_picture_url, first_name, last_name)
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', true)
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

    // Check if sender is blocked by recipient
    const { data: conv } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversation_id)
      .single();

    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const recipientId = conv.user1_id === sender_id ? conv.user2_id : conv.user1_id;

    const { data: blocked } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('user_id', recipientId)
      .eq('blocked_user_id', sender_id)
      .single();

    if (blocked) {
      return NextResponse.json({ error: 'User has blocked you' }, { status: 403 });
    }

    // Insert message
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        conversation_id,
        sender_id,
        content,
        image_url,
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        sender:sender_id(id, username, profile_picture_url, first_name, last_name)
      `)
      .single();

    if (error) throw error;

    // Update conversation last_message_id
    await supabase
      .from('conversations')
      .update({ 
        last_message_id: data.id,
        updated_at: new Date().toISOString()
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

    if (action === 'delete') {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', message_id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'pin') {
      const { data: message } = await supabase
        .from('messages')
        .select('conversation_id')
        .eq('id', message_id)
        .single();

      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      // Check if already pinned (max 3)
      const { data: pinned } = await supabase
        .from('pinned_messages')
        .select('id')
        .eq('conversation_id', message.conversation_id);

      if ((pinned?.length || 0) >= 3) {
        return NextResponse.json({ error: 'Max 3 pinned messages' }, { status: 400 });
      }

      const { error } = await supabase
        .from('pinned_messages')
        .insert([{
          conversation_id: message.conversation_id,
          message_id
        }]);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'unpin') {
      const { error } = await supabase
        .from('pinned_messages')
        .delete()
        .eq('message_id', message_id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}
