import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('muted_conversations')
      .select('conversation_id')
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ muted_conversation_ids: data.map(m => m.conversation_id) });
  } catch (error) {
    console.error('Error fetching muted conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch muted conversations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, conversation_id } = body;

    if (!user_id || !conversation_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('muted_conversations')
      .insert([{
        user_id,
        conversation_id
      }]);

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Already muted' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error muting conversation:', error);
    return NextResponse.json({ error: 'Failed to mute conversation' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, conversation_id } = body;

    if (!user_id || !conversation_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase
      .from('muted_conversations')
      .delete()
      .eq('user_id', user_id)
      .eq('conversation_id', conversation_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unmuting conversation:', error);
    return NextResponse.json({ error: 'Failed to unmute conversation' }, { status: 500 });
  }
}
