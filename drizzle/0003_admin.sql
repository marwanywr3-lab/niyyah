CREATE TABLE IF NOT EXISTS admin_auth (id INTEGER PRIMARY KEY CHECK(id=1),salt TEXT NOT NULL,code_hash TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS user_limits (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,monthly_tokens INTEGER NOT NULL CHECK(monthly_tokens>=0));
CREATE TABLE IF NOT EXISTS user_notifications (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,kind TEXT NOT NULL,message TEXT NOT NULL,created_at TEXT NOT NULL,read_at TEXT);
CREATE INDEX IF NOT EXISTS notifications_user ON user_notifications(user_id,created_at);
