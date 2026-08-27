CREATE TABLE IF NOT EXISTS public.support_conversations (
    conversation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    assigned_admin_id BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
    subject VARCHAR(200) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'WAITING',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.support_messages (
    message_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES public.support_conversations(conversation_id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL,
    content TEXT,
    attachment_key TEXT,
    attachment_name TEXT,
    attachment_content_type VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT support_messages_content_or_attachment_ck CHECK (
        NULLIF(BTRIM(content), '') IS NOT NULL OR NULLIF(BTRIM(attachment_key), '') IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_support_conversations_updated
    ON public.support_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_conversations_user
    ON public.support_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_conversation
    ON public.support_messages(conversation_id, created_at ASC);
