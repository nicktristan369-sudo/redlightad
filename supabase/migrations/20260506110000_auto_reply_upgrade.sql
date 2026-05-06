-- Upgrade auto_reply_rules with new columns from spec
ALTER TABLE auto_reply_rules ADD COLUMN IF NOT EXISTS trigger_config JSONB NOT NULL DEFAULT '{}';
ALTER TABLE auto_reply_rules ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;
ALTER TABLE auto_reply_rules ADD COLUMN IF NOT EXISTS delay_seconds INTEGER DEFAULT 5;
ALTER TABLE auto_reply_rules ADD COLUMN IF NOT EXISTS delay_randomize BOOLEAN DEFAULT true;
ALTER TABLE auto_reply_rules ADD COLUMN IF NOT EXISTS platforms JSONB DEFAULT '["whatsapp"]';
ALTER TABLE auto_reply_rules ADD COLUMN IF NOT EXISTS schedule_active JSONB DEFAULT '{"always": true}';
ALTER TABLE auto_reply_rules ADD COLUMN IF NOT EXISTS max_per_contact INTEGER DEFAULT 1;
ALTER TABLE auto_reply_rules ADD COLUMN IF NOT EXISTS cooldown_minutes INTEGER DEFAULT 60;
ALTER TABLE auto_reply_rules ADD COLUMN IF NOT EXISTS stats_sent INTEGER DEFAULT 0;
ALTER TABLE auto_reply_rules ADD COLUMN IF NOT EXISTS stats_last_used TIMESTAMPTZ;

-- Update trigger_type constraint to include all_messages
ALTER TABLE auto_reply_rules DROP CONSTRAINT IF EXISTS auto_reply_rules_trigger_type_check;
ALTER TABLE auto_reply_rules ADD CONSTRAINT auto_reply_rules_trigger_type_check 
  CHECK (trigger_type IN ('first_message', 'keyword', 'regex', 'schedule', 'ai_fallback', 'all_messages'));

-- Add auto_reply_rule_id to messenger_messages  
ALTER TABLE messenger_messages ADD COLUMN IF NOT EXISTS auto_reply_rule_id UUID;

-- Add missing columns to auto_reply_log
ALTER TABLE auto_reply_log ADD COLUMN IF NOT EXISTS contact_name VARCHAR(200);
ALTER TABLE auto_reply_log ADD COLUMN IF NOT EXISTS rule_name VARCHAR(200);
ALTER TABLE auto_reply_log ADD COLUMN IF NOT EXISTS platform VARCHAR(20) DEFAULT 'whatsapp';
ALTER TABLE auto_reply_log ADD COLUMN IF NOT EXISTS response_sent TEXT;
ALTER TABLE auto_reply_log ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;

-- New indexes
CREATE INDEX IF NOT EXISTS idx_rules_enabled_priority ON auto_reply_rules(enabled, priority);
CREATE INDEX IF NOT EXISTS idx_log_created_desc ON auto_reply_log(created_at DESC);
