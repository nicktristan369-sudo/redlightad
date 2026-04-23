-- Chat improvements: Read status + Typing indicators
-- Run this in Supabase SQL Editor

-- 1. Add read status to messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_by UUID DEFAULT NULL;

-- 2. Create typing_status table for real-time typing indicators
CREATE TABLE IF NOT EXISTS typing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(conversation_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_typing_status_conversation ON typing_status(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sender ON messages(conversation_id, sender_id);

-- Enable RLS
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;

-- Policies for typing_status
CREATE POLICY "Users can view typing in their conversations" ON typing_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = typing_status.conversation_id 
      AND (c.provider_id = auth.uid() OR c.customer_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own typing status" ON typing_status
  FOR ALL USING (auth.uid() = user_id);

-- Enable realtime on typing_status
ALTER PUBLICATION supabase_realtime ADD TABLE typing_status;

-- Comment
COMMENT ON TABLE typing_status IS 'Real-time typing indicators for chat';
COMMENT ON COLUMN messages.read_at IS 'Timestamp when message was read';
COMMENT ON COLUMN messages.read_by IS 'User who read the message';
