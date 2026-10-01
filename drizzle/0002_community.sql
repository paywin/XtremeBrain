CREATE TABLE IF NOT EXISTS social_profiles (
 user_id TEXT PRIMARY KEY NOT NULL,
 friend_code TEXT NOT NULL UNIQUE,
 share_activity INTEGER NOT NULL DEFAULT 0 CHECK(share_activity IN (0,1))
);
CREATE TABLE IF NOT EXISTS friendships (
 user_a TEXT NOT NULL,
 user_b TEXT NOT NULL,
 requester TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('pending','accepted')),
 created_at TEXT NOT NULL,
 PRIMARY KEY(user_a,user_b),
 CHECK(user_a < user_b),
 CHECK(requester=user_a OR requester=user_b)
);
CREATE INDEX IF NOT EXISTS friendships_b ON friendships(user_b,status);
CREATE TABLE IF NOT EXISTS study_presence (user_id TEXT PRIMARY KEY NOT NULL,last_ping INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS study_days (
 user_id TEXT NOT NULL,
 day TEXT NOT NULL,
 seconds INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(user_id,day)
);
CREATE TABLE IF NOT EXISTS earned_badges (
 user_id TEXT NOT NULL,
 badge_id TEXT NOT NULL,
 earned_at TEXT NOT NULL,
 PRIMARY KEY(user_id,badge_id)
);
