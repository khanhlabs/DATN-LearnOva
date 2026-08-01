import { useEffect, useState } from "react";

const ResendCountdown = ({ seconds = 60, onResend, isResending }) => {
    const [remaining, setRemaining] = useState(seconds);

    useEffect(() => {
        if (remaining <= 0) return undefined;

        const timer = setTimeout(() => setRemaining((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [remaining]);

    if (remaining > 0) {
        return (
            <p className="resend-countdown">
                Didn't receive the email? Resend available in{" "}
                <strong>{remaining}</strong> second{remaining !== 1 ? "s" : ""}.
            </p>
        );
    }

    return (
        <button
            type="button"
            className="resend-btn"
            onClick={onResend}
            disabled={isResending}
        >
            {isResending ? "Sending..." : "Resend Reset Link"}
        </button>
    );
};

export default ResendCountdown;
