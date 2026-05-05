CREATE TABLE IF NOT EXISTS whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  phone_number VARCHAR(30),
  status VARCHAR(30) DEFAULT 'disconnected',
  qr_code TEXT,
  session_data JSONB,
  avatar_url TEXT,
  auto_reply_enabled BOOLEAN DEFAULT false,
  auto_reply_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  chat_jid VARCHAR(100) NOT NULL,
  chat_name VARCHAR(200),
  chat_avatar TEXT,
  is_group BOOLEAN DEFAULT false,
  unread_count INT DEFAULT 0,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  is_pinned BOOLEAN DEFAULT false,
  is_muted BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, chat_jid)
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES whatsapp_chats(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
  message_id VARCHAR(200),
  from_me BOOLEAN DEFAULT false,
  from_jid VARCHAR(100),
  from_name VARCHAR(200),
  content TEXT,
  message_type VARCHAR(30) DEFAULT 'text',
  media_url TEXT,
  media_mime_type VARCHAR(100),
  status VARCHAR(20) DEFAULT 'sent',
  quoted_message_id VARCHAR(200),
  quoted_content TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all for authenticated" ON whatsapp_accounts FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all for authenticated" ON whatsapp_chats FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow all for authenticated" ON whatsapp_messages FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
