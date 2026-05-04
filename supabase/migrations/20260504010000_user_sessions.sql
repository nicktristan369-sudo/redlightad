CREATE TABLE IF NOT EXISTS user_sessions (
  user_id uuid PRIMARY KEY,
  last_seen timestamptz DEFAULT now() NOT NULL
);
