import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "react-toastify";
import { forgotPasswordApi } from "../../api/AuthApi.js";
import EmailSent from "./EmailSent.jsx";
import "./AuthPage.css";
import "./ForgotPassword.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [view, setView] = useState("form"); // "form" | "sent"
    const [sentToEmail, setSentToEmail] = useState("");
    const [isResending, setIsResending] = useState(false);
    const [resendKey, setResendKey] = useState(0);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm({ mode: "onBlur" });

    const sendResetLink = async (email) => {
        try {
            await forgotPasswordApi(email);
            return true;
        } catch (err) {
            const message =
                err.response?.data?.message || "Something went wrong. Please try again.";
            setError("email", { type: "server", message });
            return false;
        }
    };

    const onSubmit = async ({ email }) => {
        const ok = await sendResetLink(email);
        if (ok) {
            setSentToEmail(email);
            setView("sent");
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        const ok = await sendResetLink(sentToEmail);
        setIsResending(false);

        if (ok) {
            toast.success("A new reset link has been sent.");
            setResendKey((prev) => prev + 1);
        }
    };

    if (view === "sent") {
        return (
            <div className="auth-page forgot-password-page">
                <Link to="/learnova/home" className="auth-back-home">
                    <ArrowLeft size={20} />
                    <span>Back to home</span>
                </Link>

                <EmailSent
                    email={sentToEmail}
                    resendKey={resendKey}
                    onResend={handleResend}
                    isResending={isResending}
                    onClose={() => navigate("/learnova/auth/login")}
                />
            </div>
        );
    }

    return (
        <div className="auth-page forgot-password-page">
            <Link to="/learnova/home" className="auth-back-home">
                <ArrowLeft size={20} />
                <span>Back to home</span>
            </Link>

            <div className="auth-form-container">
                <div className="auth-form-inner">
                    <h2 className="auth-form-title">Forgot your password?</h2>
                    <p className="auth-form-subtitle">
                        Enter the email associated with your account and we'll send you a link to reset your password.
                    </p>

                    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                        <div className="form-field form-field-large" style={{ marginBottom: "24px" }}>
                            <label className="form-field-label">Email</label>
                            <div className="form-field-input">
                                <Mail size={15} className="mail-icon" />
                                <input
                                    type="email"
                                    placeholder="youremail@gmail.com"
                                    autoComplete="email"
                                    {...register("email", {
                                        required: "Email is required.",
                                        pattern: {
                                            value: EMAIL_PATTERN,
                                            message: "Please enter a valid email address.",
                                        },
                                    })}
                                />
                            </div>
                            {errors.email && <p className="field-error">{errors.email.message}</p>}
                        </div>

                        <button type="submit" className="auth-submit-button login-submit-button" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader2 size={18} className="spin" />
                            ) : (
                                <span>Send Reset Link</span>
                            )}
                        </button>

                        <p className="auth-switch-text">
                            Remembered your password?{" "}
                            <Link to="/learnova/auth/login" className="auth-switch-link">
                                Back to login
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
