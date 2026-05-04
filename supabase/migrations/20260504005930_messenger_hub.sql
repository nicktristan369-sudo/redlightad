-- MessengerHub tables

-- Messenger accounts (WhatsApp, Telegram sessions)
CREATE TABLE IF NOT EXISTS messenger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'telegram')),
  phone_number TEXT,
  display_name TEXT,
  session_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'connecting', 'connected', 'error')),
  last_connected_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messenger contacts
CREATE TABLE IF NOT EXISTS messenger_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES messenger_accounts(id) ON DELETE CASCADE,
  platform_contact_id TEXT NOT NULL,
  display_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (account_id, platform_contact_id)
);

-- Messenger conversations
CREATE TABLE IF NOT EXISTS messenger_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES messenger_accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES messenger_contacts(id) ON DELETE SET NULL,
  platform_chat_id TEXT NOT NULL,
  chat_name TEXT,
  is_group BOOLEAN DEFAULT FALSE,
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (account_id, platform_chat_id)
);

-- Messenger messages
CREATE TABLE IF NOT EXISTS messenger_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES messenger_conversations(id) ON DELETE CASCADE,
  account_id UUID REFERENCES messenger_accounts(id) ON DELETE CASCADE,
  platform_message_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'contact')),
  content TEXT,
  media_url TEXT,
  media_mime_type TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  metadata JSONB DEFAULT '{}',
  is_auto_reply BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-reply rules
CREATE TABLE IF NOT EXISTS auto_reply_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES messenger_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('first_message', 'keyword', 'regex', 'schedule', 'ai_fallback')),
  trigger_value TEXT,
  response_text TEXT,
  response_type TEXT DEFAULT 'text',
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  cooldown_seconds INTEGER DEFAULT 300,
  delay_min_ms INTEGER DEFAULT 1000,
  delay_max_ms INTEGER DEFAULT 3000,
  schedule_start TIME,
  schedule_end TIME,
  schedule_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
  ai_prompt TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-reply log
CREATE TABLE IF NOT EXISTS auto_reply_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES auto_reply_rules(id) ON DELETE SET NULL,
  account_id UUID REFERENCES messenger_accounts(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES messenger_conversations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES messenger_contacts(id) ON DELETE SET NULL,
  trigger_message TEXT,
  response_message TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session health tracking
CREATE TABLE IF NOT EXISTS messenger_session_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES messenger_accounts(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  uptime_seconds INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  last_heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (account_id)
);

-- Indexes
CREATE INDEX idx_messenger_messages_conversation ON messenger_messages(conversation_id, created_at DESC);
CREATE INDEX idx_messenger_messages_account ON messenger_messages(account_id, created_at DESC);
CREATE INDEX idx_messenger_conversations_account ON messenger_conversations(account_id, last_message_at DESC);
CREATE INDEX idx_messenger_contacts_account ON messenger_contacts(account_id);
CREATE INDEX idx_auto_reply_rules_account ON auto_reply_rules(account_id, is_active);
CREATE INDEX idx_auto_reply_log_account ON auto_reply_log(account_id, created_at DESC);
CREATE INDEX idx_messenger_session_health_account ON messenger_session_health(account_id);

-- RLS policies
ALTER TABLE messenger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messenger_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messenger_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messenger_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_reply_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_reply_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE messenger_session_health ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by the microservice)
CREATE POLICY "Service role full access" ON messenger_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON messenger_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON messenger_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON messenger_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON auto_reply_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON auto_reply_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON messenger_session_health FOR ALL USING (true) WITH CHECK (true);

-- User access policies
CREATE POLICY "Users can manage own accounts" ON messenger_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own contacts" ON messenger_contacts FOR ALL USING (account_id IN (SELECT id FROM messenger_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own conversations" ON messenger_conversations FOR ALL USING (account_id IN (SELECT id FROM messenger_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own messages" ON messenger_messages FOR ALL USING (account_id IN (SELECT id FROM messenger_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own rules" ON auto_reply_rules FOR ALL USING (account_id IN (SELECT id FROM messenger_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own reply log" ON auto_reply_log FOR SELECT USING (account_id IN (SELECT id FROM messenger_accounts WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own health" ON messenger_session_health FOR SELECT USING (account_id IN (SELECT id FROM messenger_accounts WHERE user_id = auth.uid()));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_messenger_accounts_updated_at BEFORE UPDATE ON messenger_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messenger_contacts_updated_at BEFORE UPDATE ON messenger_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messenger_conversations_updated_at BEFORE UPDATE ON messenger_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auto_reply_rules_updated_at BEFORE UPDATE ON auto_reply_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messenger_session_health_updated_at BEFORE UPDATE ON messenger_session_health FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
