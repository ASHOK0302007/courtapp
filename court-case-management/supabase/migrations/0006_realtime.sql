-- 0006_realtime.sql
-- Adds the notifications table to Supabase's realtime publication so
-- clients can subscribe to new rows (the notification bell) without polling.

alter publication supabase_realtime add table notifications;
