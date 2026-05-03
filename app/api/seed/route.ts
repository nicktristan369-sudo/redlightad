import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-seed-secret');
    if (secret !== 'dev-seed-key-12345') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testUserIds = [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002'
    ];

    // Create users
    await supabase.from('users').insert([
      {
        id: testUserIds[0],
        username: 'testuser1',
        email: 'testuser1@example.com',
        first_name: 'Test',
        last_name: 'User1'
      },
      {
        id: testUserIds[1],
        username: 'testuser2',
        email: 'testuser2@example.com',
        first_name: 'Test',
        last_name: 'User2'
      }
    ]);

    // Try different conversation schema approaches
    let conversationId: string | null = null;

    // Approach 1: Try new schema (user1_id, user2_id)
    const { data: conv1, error: err1 } = await supabase
      .from('conversations')
      .insert([
        {
          user1_id: testUserIds[0],
          user2_id: testUserIds[1]
        }
      ])
      .select('id')
      .single();

    if (conv1?.id) {
      conversationId = conv1.id;
    } else {
      // Approach 2: Try old schema (provider_id, customer_id)
      const { data: conv2, error: err2 } = await supabase
        .from('conversations')
        .insert([
          {
            provider_id: testUserIds[0],
            customer_id: testUserIds[1]
          }
        ])
        .select('id')
        .single();

      if (conv2?.id) {
        conversationId = conv2.id;
      }
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Could not create conversation - unknown schema', errors: [err1, err2] },
        { status: 400 }
      );
    }

    // Try to create messages - try different table names
    let msgCreated = false;

    // Try new messages table
    const { error: msgErr1 } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          sender_id: testUserIds[0],
          content: 'Hey! How are you?',
          created_at: new Date(Date.now() - 5 * 60000).toISOString()
        },
        {
          conversation_id: conversationId,
          sender_id: testUserIds[1],
          content: 'I am doing great! Thanks for asking 😊',
          created_at: new Date(Date.now() - 3 * 60000).toISOString()
        }
      ]);

    if (!msgErr1) {
      msgCreated = true;
    } else {
      // Try old conversation_messages table
      const { error: msgErr2 } = await supabase
        .from('conversation_messages')
        .insert([
          {
            conversation_id: conversationId,
            sender_id: testUserIds[0],
            message: 'Hey! How are you?',
            created_at: new Date(Date.now() - 5 * 60000).toISOString()
          },
          {
            conversation_id: conversationId,
            sender_id: testUserIds[1],
            message: 'I am doing great! Thanks for asking 😊',
            created_at: new Date(Date.now() - 3 * 60000).toISOString()
          }
        ]);

      if (!msgErr2) {
        msgCreated = true;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      conversation_id: conversationId,
      users: testUserIds,
      messages_created: msgCreated
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Seed failed', details: String(error) },
      { status: 500 }
    );
  }
}
