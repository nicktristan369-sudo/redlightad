-- Account country
ALTER TABLE messenger_accounts ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);

-- Contact management columns
ALTER TABLE messenger_contacts ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);
ALTER TABLE messenger_contacts ADD COLUMN IF NOT EXISTS country_name VARCHAR(100);
ALTER TABLE messenger_contacts ADD COLUMN IF NOT EXISTS custom_name VARCHAR(200);
ALTER TABLE messenger_contacts ADD COLUMN IF NOT EXISTS email VARCHAR(200);
ALTER TABLE messenger_contacts ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- notes, tags already exist from prior migration but ensure
ALTER TABLE messenger_contacts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE messenger_contacts ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
