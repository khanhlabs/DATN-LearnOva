import {Link, useNavigate} from "react-router-dom";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {ArrowRight, Eye, EyeOff, Lock, Mail} from "lucide-react";
import SocialLogin from "../social_login/SocialLogin.jsx";
import {useAuth} from "../../../../hook/useAuth.jsx"

const LoginForm = ({ onSwitchToRegister }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [form, setForm] = useState({email: '', password: '', rememberMe: false});
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const {login} = useAuth();

    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    }

    const handleSubmit = async(e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await login(form.email, form.password, form.rememberMe);

            if (!data?.accessToken) {
                throw new Error("No access token returned");
            }

            const roles = data.user?.roles ?? [];
            const activeRole = data.user?.activeRole;
            // A stale activeRole (e.g. left over after a role was revoked) must not
            // send the user into a dashboard they no longer have access to.
            // Admin accounts must always enter the admin dashboard even when
            // activeRole is null/stale in imported legacy data.
            const effectiveRole = roles.includes("ROLE_ADMIN")
                ? "ROLE_ADMIN"
                : activeRole && roles.includes(activeRole)
                    ? activeRole
                    : roles.includes("ROLE_TEACHER")
                        ? "ROLE_TEACHER"
                        : null;

            if (effectiveRole === "ROLE_ADMIN") {
                navigate('/learnova/admin');
            } else if (effectiveRole === "ROLE_TEACHER") {
                navigate('/learnova/teacher');
            } else {
                navigate('/');
            }
        }catch (err) {
            const message =
                err.response?.data?.message ||
                t("auth.login.genericError");

            setError(message);
        }
    }

    return (
        <div className="auth-form-container">
            <div className="auth-form-inner">

                <div>
                    <h2 className="auth-form-title">{t("auth.login.title")}</h2>
                    <p className="auth-form-subtitle">{t("auth.login.subtitle")}</p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-field form-field-large" style={{marginBottom: '40px'}}>
                            <label className="form-field-label">{t("auth.login.email")}</label>
                            <div className="form-field-input">
                                <Mail size={15} className="mail-icon"/>
                                <input
                                    type="email" name="email"
                                    placeholder={t("auth.login.emailPlaceholder")}
                                    value={form.email} autoComplete="email" onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-field" style={{marginBottom: '10px'}}>
                            <label className="form-field-label">{t("auth.login.password")}</label>
                            <div className="form-field-input">
                                <Lock size={15} className="mail-icon"/>
                                <input
                                    type={showPassword ? 'text' : 'password'} name="password"
                                    placeholder={t("auth.login.passwordPlaceholder")}
                                    value={form.password} autoComplete="current-password" onChange={handleChange}
                                    required
                                />

                                <button type="button" className="show-password-button"
                                        onClick={() => setShowPassword((show) => !show)}>
                                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="auth-error">
                                {error}
                            </p>
                        )}

                        <div className="form-options">
                            <label className="form-option-rememberMe">
                                <input
                                    type="checkbox" name="rememberMe"
                                    checked={form.rememberMe} onChange={handleChange}
                                />
                                {t("auth.login.rememberMe")}
                            </label>

                            <Link to="/forgot-password" className="form-option-forgot">{t("auth.login.forgotPassword")}</Link>
                        </div>

                        <button type="submit" className="auth-submit-button login-submit-button">
                            <span>{t("auth.login.submit")}</span>
                            <span className="login-submit-icon" aria-hidden="true">
                                <ArrowRight size={18}/>
                            </span>
                        </button>
                        <p className="auth-switch-text">
                            {t("auth.login.noAccount")}{''}
                            <button
                                type="button"
                                className="auth-switch-link auth-switch-button"
                                onClick={onSwitchToRegister}
                            >
                                {t("auth.login.signUp")}
                            </button>
                        </p>
                    </form>

                    <SocialLogin/>



                </div>
            </div>
        </div>
    );
}

export default LoginForm;
