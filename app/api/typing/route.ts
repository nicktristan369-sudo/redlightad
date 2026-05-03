import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Track typing users (in-memory, real app would use Redis)
const typingUsers = new Map<string, Set<string>>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_id, user_id, is_typing } = body;

    if (!conversation_id || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!typingUsers.has(conversation_id)) {
      typingUsers.set(conversation_id, new Set());
    }

    const conversationTyping = typingUsers.get(conversation_id)!;

    if (is_typing) {
      conversationTyping.add(user_id);
    } else {
      conversationTyping.delete(user_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating typing status:', error);
    return NextResponse.json({ error: 'Failed to update typing status' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversation_id' }, { status: 400 });
    }

    const typingList = Array.from(typingUsers.get(conversationId) || []);
    
    return NextResponse.json({ typing_user_ids: typingList });
  } catch (error) {
    console.error('Error fetching typing status:', error);
    return NextResponse.json({ error: 'Failed to fetch typing status' }, { status: 500 });
  }
}
