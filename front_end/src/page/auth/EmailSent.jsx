import { MailCheck } from "lucide-react";
import ResendCountdown from "./components/ResendCountdown.jsx";

const EMAIL_PROVIDER_URLS = {
    "gmail.com": "https://mail.google.com",
    "googlemail.com": "https://mail.google.com",
    "outlook.com": "https://outlook.live.com/mail/",
    "hotmail.com": "https://outlook.live.com/mail/",
    "live.com": "https://outlook.live.com/mail/",
    "yahoo.com": "https://mail.yahoo.com",
    "icloud.com": "https://www.icloud.com/mail",
};

const openEmailProvider = (email) => {
    const domain = email?.split("@")[1]?.toLowerCase();
    const url = domain && EMAIL_PROVIDER_URLS[domain];

    if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
    }
};

const EmailSent = ({ email, resendKey, onResend, isResending, onClose }) => (
    <div className="auth-form-container">
        <div className="auth-form-inner email-sent-view">
            <MailCheck size={56} className="email-sent-icon" />

            <h2 className="auth-form-title">Reset link has been sent successfully.</h2>

            <p className="auth-form-subtitle">
                We've sent a password reset link to <strong>{email}</strong>.
                Please check your inbox and click the link to continue.
            </p>

            <div className="email-sent-actions">
                <button
                    type="button"
                    className="auth-submit-button"
                    onClick={() => openEmailProvider(email)}
                >
                    Open Email
                </button>

                <button type="button" className="auth-submit-button auth-submit-button--ghost" onClick={onClose}>
                    Close
                </button>
            </div>

            <ResendCountdown
                key={resendKey}
                seconds={60}
                onResend={onResend}
                isResending={isResending}
            />
        </div>
    </div>
);

export default EmailSent;
