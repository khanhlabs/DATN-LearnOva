import { useTranslation } from "react-i18next";
import gg_svg from "../../../../../assets/svg_icon/Google.svg"
import fb_svg from "../../../../../assets/svg_icon/FaceBook.svg"

const SocialLogin = () => {
    const { t } = useTranslation();

    // const handleGoogleLogin = () => {
    //     const apiUrl = import.meta.env.VITE_API_URL || "/api/learnova";
    //     const apiOrigin = apiUrl.replace(/\/api\/learnova\/?$/, "");
    //     window.location.href = `${apiOrigin}/oauth2/authorization/google`;
    // };

    const handleGoogleLogin = () => {
        window.location.href = "/oauth2/authorization/google";
    };

    // const handleFacebookLogin = () => {
    //     const apiUrl = import.meta.env.VITE_API_URL || "/api/learnova";
    //     const apiOrigin = apiUrl.replace(/\/api\/learnova\/?$/, "");
    //     window.location.href = `${apiOrigin}/oauth2/authorization/facebook`;
    // };

    const handleFacebookLogin = () => {
        window.location.href = "/oauth2/authorization/facebook";
    };

    return (
        <div className="auth-socials">
            <div className="social-login-divider">
                <span>{t("auth.logo.otherOptions")}</span>
            </div>

            <div className="social-login-buttons">
                <button
                    type="button"
                    className="social-login-btn-gg"
                    aria-label={t("auth.logo.continueWithGoogle")}
                    onClick={handleGoogleLogin}
                >
                    <img src={gg_svg} alt="google" width={20}/>
                </button>

                <button
                    type="button"
                    className="social-login-btn-fb"
                    aria-label={t("auth.logo.continueWithFacebook")}
                    onClick={handleFacebookLogin}
                >
                    <img src={fb_svg} alt="facebook" width={20}/>
                </button>

            </div>
        </div>
    );
}

export default SocialLogin;
