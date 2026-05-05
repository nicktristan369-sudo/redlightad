import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message_id, conversation_id } = body;

    if (!message_id || !conversation_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check pinned count
    const { data: pinned } = await supabase
      .from('pinned_messages')
      .select('id')
      .eq('conversation_id', conversation_id);

    if ((pinned?.length || 0) >= 3) {
      return NextResponse.json({ error: 'Max 3 pinned messages' }, { status: 400 });
    }

    // Pin message
    const { error } = await supabase
      .from('pinned_messages')
      .insert([{
        conversation_id,
        message_id,
        pinned_at: new Date().toISOString()
      }]);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error pinning message:', error);
    return NextResponse.json({ error: 'Failed to pin message' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { message_id } = body;

    if (!message_id) {
      return NextResponse.json({ error: 'Missing message_id' }, { status: 400 });
    }

    const { error } = await supabase
      .from('pinned_messages')
      .delete()
      .eq('message_id', message_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unpinning message:', error);
    return NextResponse.json({ error: 'Failed to unpin message' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversation_id' }, { status: 400 });
    }

    const { data } = await supabase
      .from('pinned_messages')
      .select(`
        message_id,
        pinned_at,
        message:message_id(
          id,
          sender_id,
          content,
          image_url,
          created_at,
          sender:sender_id(id, username, profile_picture_url)
        )
      `)
      .eq('conversation_id', conversationId)
      .order('pinned_at', { ascending: false });

    return NextResponse.json({ pinned_messages: data || [] });
  } catch (error) {
    console.error('Error fetching pinned messages:', error);
    return NextResponse.json({ error: 'Failed to fetch pinned messages' }, { status: 500 });
  }
}
