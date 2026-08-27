CREATE TABLE IF NOT EXISTS user_vouchers (
    user_voucher_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    voucher_id BIGINT NOT NULL REFERENCES vouchers(voucher_id) ON DELETE CASCADE,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'CLAIMED',
    CONSTRAINT uq_user_vouchers_user_voucher UNIQUE (user_id, voucher_id)
);

CREATE INDEX IF NOT EXISTS idx_user_vouchers_user_id ON user_vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vouchers_voucher_id ON user_vouchers(voucher_id);
