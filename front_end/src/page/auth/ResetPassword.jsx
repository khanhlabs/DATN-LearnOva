import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, XCircle } from "lucide-react";
import { resetPasswordApi, validateResetTokenApi } from "../../api/AuthApi.js";
import PasswordStrengthMeter from "./components/PasswordStrengthMeter.jsx";
import { getPasswordStrength } from "./components/passwordStrength.js";
import WarningModal from "./components/WarningModal.jsx";
import SuccessModal from "./components/SuccessModal.jsx";
import "./AuthPage.css";
import "./ForgotPassword.css";

const REDIRECT_DELAY_MS = 3000;

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [status, setStatus] = useState("validating"); // validating | invalid | valid | success
    const [statusMessage, setStatusMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [pendingValues, setPendingValues] = useState(null);
    const hasValidated = useRef(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
        setError,
    } = useForm({ mode: "onChange" });

    const password = watch("newPassword", "");

    useEffect(() => {
        if (!token) {
            setStatus("invalid");
            setStatusMessage("Reset link is invalid.");
            return;
        }

        if (hasValidated.current) return;
        hasValidated.current = true;

        validateResetTokenApi(token)
            .then(() => setStatus("valid"))
            .catch((err) => {
                setStatus("invalid");
                setStatusMessage(
                    err.response?.data?.message || "Reset link is invalid.",
                );
            });
    }, [token]);

    const submitReset = async (newPassword) => {
        try {
            await resetPasswordApi(token, newPassword);
            setStatus("success");

            setTimeout(() => {
                navigate("/learnova/auth/login");
            }, REDIRECT_DELAY_MS);
        } catch (err) {
            const message =
                err.response?.data?.message || "Something went wrong. Please try again.";
            setError("newPassword", { type: "server", message });
        }
    };

    const onSubmit = async (values) => {
        const { level } = getPasswordStrength(values.newPassword);

        if (level === "Weak") {
            setPendingValues(values);
            return;
        }

        await submitReset(values.newPassword);
    };

    const handleContinueWithWeakPassword = async () => {
        const values = pendingValues;
        setPendingValues(null);
        if (values) {
            await submitReset(values.newPassword);
        }
    };

    if (status === "validating") {
        return (
            <div className="auth-page forgot-password-page">
                <div className="auth-form-container">
                    <div className="auth-form-inner reset-status-view">
                        <Loader2 size={48} className="spin" />
                        <h2 className="auth-form-title">Validating reset link...</h2>
                    </div>
                </div>
            </div>
        );
    }

    if (status === "invalid") {
        return (
            <div className="auth-page forgot-password-page">
                <div className="auth-form-container">
                    <div className="auth-form-inner reset-status-view">
                        <XCircle size={48} color="#ef4444" />
                        <h2 className="auth-form-title">{statusMessage}</h2>
                        <p className="auth-form-subtitle">Please request another password reset.</p>
                        <Link to="/forgot-password" className="auth-submit-button login-submit-button">
                            Request New Reset Link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="auth-page forgot-password-page">
                <SuccessModal
                    title="Password has been changed successfully."
                    message="Redirecting you to the login page..."
                    onClose={() => navigate("/learnova/auth/login")}
                    closeLabel="Back to Login"
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
                    <h2 className="auth-form-title">Reset your password</h2>
                    <p className="auth-form-subtitle">Choose a new password for your account.</p>

                    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                        <div className="form-field" style={{ marginBottom: "10px" }}>
                            <label className="form-field-label">New Password</label>
                            <div className="form-field-input">
                                <Lock size={15} className="mail-icon" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    {...register("newPassword", {
                                        required: "Password is required.",
                                        minLength: {
                                            value: 6,
                                            message: "Password must be at least 6 characters.",
                                        },
                                    })}
                                />
                                <button
                                    type="button"
                                    className="show-password-button"
                                    onClick={() => setShowPassword((show) => !show)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.newPassword && <p className="field-error">{errors.newPassword.message}</p>}
                            <PasswordStrengthMeter password={password} />
                        </div>

                        <div className="form-field" style={{ marginBottom: "10px" }}>
                            <label className="form-field-label">Confirm Password</label>
                            <div className="form-field-input">
                                <Lock size={15} className="mail-icon" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    {...register("confirmPassword", {
                                        required: "Confirm password is required.",
                                        validate: (value) =>
                                            value === password || "Passwords do not match.",
                                    })}
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className="field-error">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <button type="submit" className="auth-submit-button login-submit-button" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 size={18} className="spin" /> : <span>Reset Password</span>}
                        </button>
                    </form>
                </div>
            </div>

            {pendingValues && (
                <WarningModal
                    title="Your password is weak."
                    message="We recommend using uppercase letters, lowercase letters, numbers and special characters."
                    onContinue={handleContinueWithWeakPassword}
                    onCancel={() => setPendingValues(null)}
                />
            )}
        </div>
    );
};

export default ResetPassword;
