import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Delete old sessions (older than 5 minutes)
    await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', user_id)
      .lt('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    // Upsert current session
    const { error } = await supabase
      .from('user_sessions')
      .upsert([{
        user_id,
        last_seen: new Date().toISOString()
      }], { onConflict: 'user_id' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const { data } = await supabase
      .from('user_sessions')
      .select('last_seen')
      .eq('user_id', userId)
      .single();

    if (!data) {
      return NextResponse.json({ online: false, last_seen: null });
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const lastSeen = new Date(data.last_seen);
    const isOnline = lastSeen > fiveMinutesAgo;

    return NextResponse.json({
      online: isOnline,
      last_seen: data.last_seen
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
