import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_id, user_id } = body;

    if (!conversation_id || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get conversation
    const { data: conv } = await supabase
      .from('conversations')
      .select('user1_id, user2_id')
      .eq('id', conversation_id)
      .single();

    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conv.user1_id === user_id) {
      await supabase
        .from('conversations')
        .update({
          deleted_by_user1: true,
          deleted_at_user1: new Date().toISOString()
        })
        .eq('id', conversation_id);
    } else if (conv.user2_id === user_id) {
      await supabase
        .from('conversations')
        .update({
          deleted_by_user2: true,
          deleted_at_user2: new Date().toISOString()
        })
        .eq('id', conversation_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
