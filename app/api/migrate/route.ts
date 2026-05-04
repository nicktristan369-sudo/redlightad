import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { secret } = await request.json().catch(() => ({ secret: '' }));
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!secret || secret !== key.slice(-10)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Use fetch with the Supabase SQL API (available on newer Supabase instances)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  
  const sql = `
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES messages(id) ON DELETE SET NULL;
    CREATE TABLE IF NOT EXISTS pinned_messages (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      pinned_by uuid NOT NULL,
      pinned_at timestamptz DEFAULT now(),
      UNIQUE(conversation_id, message_id)
    );
  `;

  // Use the Supabase HTTP API for SQL execution
  const res = await fetch(`${url}/rest/v1/`, {
    method: 'OPTIONS',
    headers: { 'apikey': key },
  });

  // Fallback: try to directly test if columns/tables exist
  const supabase = createClient(url, key);
  
  const results: Record<string, string> = {};

  // Test reply_to_id
  const { error: colErr } = await supabase.from('messages').select('reply_to_id').limit(1);
  results.reply_to_id = colErr ? `missing: ${colErr.message}` : 'exists';

  // Test pinned_messages
  const { error: tblErr } = await supabase.from('pinned_messages').select('id').limit(1);
  results.pinned_messages = tblErr ? `missing: ${tblErr.message}` : 'exists';

  // If migrations needed, return SQL for manual execution
  if (colErr || tblErr) {
    results.manual_sql = sql;
  }

  return NextResponse.json(results);
}
