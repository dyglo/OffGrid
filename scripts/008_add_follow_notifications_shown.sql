-- Add a boolean to track whether a follow notification has been shown to the user
ALTER TABLE follow_notifications
ADD COLUMN IF NOT EXISTS notification_shown boolean NOT NULL DEFAULT FALSE;

-- Optional: create an index for quick lookups by follower_id + notification_shown
CREATE INDEX IF NOT EXISTS idx_follow_notifications_follower_shown ON follow_notifications (follower_id, notification_shown);
