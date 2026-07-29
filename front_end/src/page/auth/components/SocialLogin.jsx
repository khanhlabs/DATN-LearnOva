import { useTranslation } from "react-i18next";
import gg_svg from "../../../assets/login/Ggoogle.svg"
import fb_svg from "../../../assets/login/Facebook.svg"

const SocialLogin = () => {
    const { t } = useTranslation();

    const handleGoogleLogin = () => {
        window.location.href =
            "http://localhost:8080/oauth2/authorization/google";
    };
    const handleFacebookLogin = () => {
        window.location.href =
            "http://localhost:8080/oauth2/authorization/facebook";
    };

    return (
        <div className="auth-socials">
            <div className="social-login-divider">
                <span>{t("auth.social.otherOptions")}</span>
            </div>

            <div className="social-login-buttons">
                <button
                    type="button"
                    className="social-login-btn-gg"
                    aria-label={t("auth.social.continueWithGoogle")}
                    onClick={handleGoogleLogin}
                >
                    <img src={gg_svg} alt="google" width={20}/>
                </button>

                <button
                    type="button"
                    className="social-login-btn-fb"
                    aria-label={t("auth.social.continueWithFacebook")}
                    onClick={handleFacebookLogin}
                >
                    <img src={fb_svg} alt="facebook" width={20}/>
                </button>

            </div>
        </div>
    );
}

export default SocialLogin;