-- =====================================================
-- AGENCY SMS MANAGEMENT SYSTEM - Database Schema
-- =====================================================

-- 1. PHONES - Hver fysisk telefon med sin persona
CREATE TABLE IF NOT EXISTS agency_phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  device_id VARCHAR(100), -- Unikt ID fra Android app
  
  -- Persona information
  persona_name VARCHAR(100) NOT NULL,
  persona_age INT,
  persona_gender VARCHAR(20),
  persona_height VARCHAR(20),
  persona_weight VARCHAR(20),
  persona_location VARCHAR(200),
  persona_nationality VARCHAR(100),
  persona_languages TEXT[], -- ['Danish', 'English']
  persona_services TEXT[], -- ['Escort', 'Massage']
  persona_rates JSONB, -- {"30min": 1000, "1hour": 2000}
  persona_availability TEXT, -- "Mon-Fri 18:00-02:00"
  persona_description TEXT, -- Generel beskrivelse
  persona_personality TEXT, -- "Flirty, venlig, professionel"
  
  -- AI Settings
  ai_enabled BOOLEAN DEFAULT true,
  ai_response_delay_min INT DEFAULT 45, -- Minimum sekunder før svar
  ai_response_delay_max INT DEFAULT 90, -- Maximum sekunder før svar
  ai_style TEXT DEFAULT 'friendly', -- friendly, flirty, professional
  ai_language VARCHAR(10) DEFAULT 'da', -- Primært sprog
  
  -- Custom Q&A pairs
  custom_qa JSONB DEFAULT '[]', -- [{"q": "hvad koster", "a": "1 time koster 2000kr"}]
  
  -- Status
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ,
  battery_level INT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CONVERSATIONS - Samtaler med kunder
CREATE TABLE IF NOT EXISTS agency_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_id UUID NOT NULL REFERENCES agency_phones(id) ON DELETE CASCADE,
  customer_phone VARCHAR(20) NOT NULL,
  customer_name VARCHAR(100), -- Hvis kendt
  
  -- Status
  status VARCHAR(20) DEFAULT 'ai_handling', -- ai_handling, manual, closed
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  priority INT DEFAULT 0, -- 0=normal, 1=high, 2=urgent
  
  -- Stats
  message_count INT DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(phone_id, customer_phone)
);

-- 3. MESSAGES - Alle beskeder
CREATE TABLE IF NOT EXISTS agency_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES agency_conversations(id) ON DELETE CASCADE,
  phone_id UUID NOT NULL REFERENCES agency_phones(id) ON DELETE CASCADE,
  
  -- Message content
  direction VARCHAR(10) NOT NULL, -- 'inbound' or 'outbound'
  content TEXT NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, read, failed
  sent_by VARCHAR(20) DEFAULT 'ai', -- 'ai', 'manual', 'customer'
  
  -- AI info
  ai_generated BOOLEAN DEFAULT false,
  ai_confidence FLOAT, -- 0-1 hvor sikker AI var
  
  -- Timing
  received_at TIMESTAMPTZ,
  scheduled_send_at TIMESTAMPTZ, -- Når AI scheduler svaret
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. KEYWORDS - Trigger notifikationer
CREATE TABLE IF NOT EXISTS agency_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_id UUID REFERENCES agency_phones(id) ON DELETE CASCADE, -- NULL = alle telefoner
  
  keyword VARCHAR(200) NOT NULL,
  match_type VARCHAR(20) DEFAULT 'contains', -- contains, exact, regex
  
  -- Action
  action VARCHAR(20) DEFAULT 'notify', -- notify, flag, takeover, block
  notification_message TEXT,
  priority INT DEFAULT 1,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. NOTIFICATIONS - Alerts til admin
CREATE TABLE IF NOT EXISTS agency_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_id UUID REFERENCES agency_phones(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES agency_conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES agency_messages(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL, -- keyword_match, takeover_needed, phone_offline, etc
  title VARCHAR(200) NOT NULL,
  body TEXT,
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AI TEMPLATES - Foruddefinerede svar
CREATE TABLE IF NOT EXISTS agency_ai_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_id UUID REFERENCES agency_phones(id) ON DELETE CASCADE, -- NULL = global
  
  category VARCHAR(100) NOT NULL, -- greeting, pricing, location, services, etc
  trigger_phrases TEXT[], -- Phrases der matcher denne template
  response_templates TEXT[], -- Mulige svar (vælger random)
  
  priority INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BLOCKED NUMBERS
CREATE TABLE IF NOT EXISTS agency_blocked_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_id UUID REFERENCES agency_phones(id) ON DELETE CASCADE, -- NULL = alle
  blocked_number VARCHAR(20) NOT NULL,
  reason TEXT,
  blocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON agency_conversations(phone_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON agency_conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON agency_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON agency_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON agency_notifications(is_read) WHERE is_read = false;

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE agency_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE agency_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE agency_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE agency_phones;
