ALTER TABLE vaults ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0;
CREATE TABLE vault_history (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 version INTEGER NOT NULL, salt TEXT NOT NULL, iv TEXT NOT NULL,
 ciphertext TEXT NOT NULL, updated_at INTEGER NOT NULL,
 PRIMARY KEY(user_id,version)
);
CREATE TRIGGER vault_revision_history AFTER UPDATE ON vaults BEGIN
 INSERT INTO vault_history(user_id,version,salt,iv,ciphertext,updated_at)
 VALUES(OLD.user_id,OLD.version,OLD.salt,OLD.iv,OLD.ciphertext,OLD.updated_at);
 DELETE FROM vault_history WHERE user_id=NEW.user_id AND version NOT IN
 (SELECT version FROM vault_history WHERE user_id=NEW.user_id ORDER BY version DESC LIMIT 3);
END;
