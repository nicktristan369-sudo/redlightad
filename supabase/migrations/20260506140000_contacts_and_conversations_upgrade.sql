-- Contact management columns
ALTER TABLE messenger_contacts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE messenger_contacts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE messenger_contacts ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;

-- Conversation management columns
ALTER TABLE messenger_conversations ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE messenger_conversations ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE messenger_conversations ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false;
ALTER TABLE messenger_conversations ADD COLUMN IF NOT EXISTS marked_unread BOOLEAN DEFAULT false;
