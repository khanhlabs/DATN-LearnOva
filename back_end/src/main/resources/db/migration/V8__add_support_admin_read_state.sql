ALTER TABLE public.support_conversations
    ADD COLUMN IF NOT EXISTS admin_read_at TIMESTAMP WITHOUT TIME ZONE;
