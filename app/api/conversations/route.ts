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
      .select('provider_id, customer_id')
      .eq('id', conversation_id)
      .single();

    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify user is part of this conversation
    if (conv.provider_id !== user_id && conv.customer_id !== user_id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Delete the conversation
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversation_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
