import { useState, useEffect, useRef } from "react"; // Import thêm useRef để quản lý interval chuẩn xác
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { registerApi, resendVerifyEmailApi } from "../../../api/AuthApi.js";
import { toast } from "react-toastify";
import { MdMarkEmailRead } from "react-icons/md";

const RegisterForm = ({ onSwitchToLogin }) => {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const timerRef = useRef(null);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    }
    const startCountdown = () => {
        if (timerRef.current) clearInterval(timerRef.current);

        setCountdown(60);
        setCanResend(false);

        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };
    useEffect(() => {
        if (showVerifyModal) {
            startCountdown();
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [showVerifyModal]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError(t("auth.register.passwordMismatch"));
            return;
        }

        if (form.password.length < 6) {
            setError(t("auth.register.passwordTooShort"));
            return;
        }

        try {
            setLoading(true);
            const res = await registerApi(form);

            toast.success(res.message || t("auth.register.registerSuccess"));
            setShowVerifyModal(true);
        } catch (err) {
            setError(err.response?.data?.message || t("auth.register.registerFailed"));
        } finally {
            setLoading(false);
        }
    };
    
    const handleResendEmail = async (e) => {
        e.preventDefault();
        if (!canResend || loading) return;
        try {
            setLoading(true);
            const res = await resendVerifyEmailApi(form.email);
            toast.success(res?.message || t("auth.register.resendSuccess"));
            startCountdown();
        } catch (err) {
            const errorMsg = err.response?.data?.message || t("auth.register.resendFailed");
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* --- MODAL THÔNG BÁO CHECK EMAIL --- */}
            {showVerifyModal && (
                <div className="modal-overlay">
                    <div className="modal-box-register">
                        <div className="register-modal-header">
                            <h2 className="register-modal-title">
                                {t("auth.register.checkInboxTitle")}
                            </h2>

                            <div className="register-modal-icon">
                                <MdMarkEmailRead />
                            </div>
                        </div>

                        <p>
                            {t("auth.register.checkInboxMessage")}<br />
                            {t("auth.register.checkInboxMessage2")}
                        </p>

                        <div className="modal-actions-register">
                            <button
                                type="button"
                                className="btn-primary-register"
                                onClick={() => window.open("https://mail.google.com", "_blank")}
                            >
                                {t("auth.register.openGmail")}
                            </button>

                            <button
                                type="button"
                                className="btn-secondary-register"
                                disabled={!canResend || loading}
                                onClick={handleResendEmail} // Gọi hàm đã được fix
                            >
                                {loading ? t("auth.register.resending") : canResend ? t("auth.register.resendEmail") : t("auth.register.resendIn", { seconds: countdown })}
                            </button>
                        </div>

                        <button
                            type="button"
                            className="btn-close-register"
                            onClick={() => {
                                setShowVerifyModal(false);
                                if (timerRef.current) clearInterval(timerRef.current); // Tắt bộ đếm ngầm khi đóng modal
                            }}
                        >
                            {t("auth.register.close")}
                        </button>
                    </div>
                </div>
            )}

            {/* --- GIAO DIỆN FORM ĐĂNG KÝ CHÍNH --- */}
            <div className="auth-form-container">
                <div className="auth-form-inner">
                    <div>
                        <h2 className="auth-form-title">{t("auth.register.title")}</h2>
                        <p className="auth-form-subtitle">{t("auth.register.subtitle")}</p>

                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="form-field">
                                <label className="form-field-label">{t("auth.register.fullName")}</label>
                                <div className="form-field-input">
                                    <User size={15} className="mail-icon"/>
                                    <input
                                        type="text"
                                        name="fullName"
                                        placeholder={t("auth.register.fullNamePlaceholder")}
                                        value={form.fullName}
                                        autoComplete="name"
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-field">
                                <label className="form-field-label">{t("auth.register.email")}</label>
                                <div className="form-field-input">
                                    <Mail size={15} className="mail-icon"/>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder={t("auth.register.emailPlaceholder")}
                                        value={form.email}
                                        autoComplete="email"
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-field">
                                <label className="form-field-label">{t("auth.register.password")}</label>
                                <div className="form-field-input">
                                    <Lock size={15} className="mail-icon"/>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        placeholder={t("auth.register.passwordPlaceholder")}
                                        value={form.password}
                                        autoComplete="new-password"
                                        onChange={handleChange}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="show-password-button"
                                        onClick={() => setShowPassword((show) => !show)}
                                    >
                                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                    </button>
                                </div>
                            </div>

                            <div className="form-field" style={{marginBottom: '30px'}}>
                                <label className="form-field-label">{t("auth.register.confirmPassword")}</label>
                                <div className="form-field-input">
                                    <Lock size={15} className="mail-icon"/>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        placeholder={t("auth.register.confirmPasswordPlaceholder")}
                                        value={form.confirmPassword}
                                        autoComplete="new-password"
                                        onChange={handleChange}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="show-password-button"
                                        onClick={() => setShowConfirmPassword((show) => !show)}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                    </button>
                                </div>
                                {error && (
                                    <p className="auth-error">
                                        {error}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="auth-submit-button"
                                disabled={loading}
                            >
                                {loading && !showVerifyModal ? (
                                    <>
                                        <span className="spinner"></span>
                                        <span style={{ marginLeft: "8px" }}>{t("auth.register.sendingEmail")}</span>
                                    </>
                                ) : (
                                    t("auth.register.submit")
                                )}
                            </button>

                            <p className="auth-switch-text">
                                {t("auth.register.alreadyHaveAccount")}{''}
                                <button
                                    type="button"
                                    className="auth-switch-link auth-switch-button"
                                    onClick={onSwitchToLogin}
                                >
                                    {t("auth.register.signIn")}
                                </button>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

export default RegisterForm;