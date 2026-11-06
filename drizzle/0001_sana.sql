CREATE TABLE ai_requests (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, period TEXT NOT NULL, tokens INTEGER NOT NULL CHECK(tokens >= 0), cost_micros INTEGER NOT NULL CHECK(cost_micros >= 0), state TEXT NOT NULL, created_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX ai_requests_user_period ON ai_requests(user_id,period);
--> statement-breakpoint
CREATE INDEX ai_requests_created ON ai_requests(user_id,created_at);
