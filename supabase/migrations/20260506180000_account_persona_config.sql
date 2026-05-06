ALTER TABLE messenger_accounts ADD COLUMN IF NOT EXISTS persona_config JSONB DEFAULT '{}';
