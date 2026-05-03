import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    // Security: Only allow in development or with secret
    const secret = request.headers.get('x-seed-secret');
    if (secret !== 'dev-seed-key-12345') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create test users
    const testUserIds = [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002'
    ];

    // Insert users
    const { error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: testUserIds[0],
          username: 'testuser1',
          email: 'testuser1@example.com',
          first_name: 'Test',
          last_name: 'User1',
          profile_picture_url: null
        },
        {
          id: testUserIds[1],
          username: 'testuser2',
          email: 'testuser2@example.com',
          first_name: 'Test',
          last_name: 'User2',
          profile_picture_url: null
        }
      ])
      .select();

    if (userError) {
      console.log('User insert result:', userError);
      // Continue even if users exist
    }

    // Create conversation
    const { data: conversationData, error: convError } = await supabase
      .from('conversations')
      .insert([
        {
          user1_id: testUserIds[0],
          user2_id: testUserIds[1]
        }
      ])
      .select()
      .single();

    if (convError) {
      console.log('Conversation error:', convError);
      return NextResponse.json(
        { error: 'Failed to create conversation', details: convError },
        { status: 400 }
      );
    }

    if (!conversationData) {
      return NextResponse.json({ error: 'No conversation created' }, { status: 400 });
    }

    // Create test messages
    const { error: msgError } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationData.id,
          sender_id: testUserIds[0],
          content: 'Hey! How are you?',
          created_at: new Date(Date.now() - 5 * 60000).toISOString()
        },
        {
          conversation_id: conversationData.id,
          sender_id: testUserIds[1],
          content: 'I am doing great! Thanks for asking 😊',
          created_at: new Date(Date.now() - 3 * 60000).toISOString()
        }
      ]);

    if (msgError) {
      console.log('Message error:', msgError);
      return NextResponse.json(
        { error: 'Failed to create messages', details: msgError },
        { status: 400 }
      );
    }

    // Get last message for conversation update
    const { data: messages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationData.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (messages && messages.length > 0) {
      await supabase
        .from('conversations')
        .update({ last_message_id: messages[0].id, updated_at: new Date().toISOString() })
        .eq('id', conversationData.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      conversation_id: conversationData.id,
      users: testUserIds
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Seed failed', details: String(error) },
      { status: 500 }
    );
  }
}
