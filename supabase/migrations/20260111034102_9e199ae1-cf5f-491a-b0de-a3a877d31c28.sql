-- Enable REPLICA IDENTITY FULL for realtime updates
ALTER TABLE public.stores REPLICA IDENTITY FULL;

-- Add stores table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.stores;