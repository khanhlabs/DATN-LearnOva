import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import AuthBanner from "./components/banner/AuthBanner.jsx";
import LoginForm from "./components/login_form/LoginForm.jsx";
import RegisterForm from "./components/register_form/RegisterForm.jsx";
import VerifyAccountModal from "./components/modal/verify/VerifyAccountModal.jsx";
import { verifyAccountApi } from "../../api/auth/AuthApi.js";
import "./AuthPage.css";

const AuthPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const authMode =
    searchParams.get("mode") === "register" ? "register" : "login";
  const isRegisterMode = authMode === "register";
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState("processing"); // processing, success, error
  const [verifyMessage, setVerifyMessage] = useState(
    t("auth.verify.activating"),
  );

  const hasFetched = useRef(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token && !hasFetched.current) {
      hasFetched.current = true;
      setIsVerifying(true);
      setVerifyStatus("processing");
      verifyAccountApi(token)
        .then((data) => {
          setVerifyStatus("success");
          setVerifyMessage(
            data?.message ||
              t("auth.verify.successMessage"),
          );
          toast.success(t("auth.verify.successToast"));

          setTimeout(() => {
            setIsVerifying(false);
            setSearchParams({ mode: "login" });
          }, 3000);
        })
        .catch((err) => {
          setVerifyStatus("error");
          const errorMsg =
            err.response?.data?.message ||
            t("auth.verify.expiredLink");
          setVerifyMessage(errorMsg);
          toast.error(errorMsg);
        });
    }
  }, [searchParams, setSearchParams, t]);

  const switchToRegister = () => {
    setSearchParams({ mode: "register" });
  };

  const switchToLogin = () => {
    setSearchParams({ mode: "login" });
  };

  return (
    <div
      className={`auth-page ${isRegisterMode ? "register-mode" : ""}`}
      style={{ position: "relative" }}
    >
      <Link to="/" className="auth-back-home">
        <ArrowLeft size={20} />
        <span>{t("auth.backToHome")}</span>
      </Link>

      <div className="auth-form-panel login-panel">
        <LoginForm onSwitchToRegister={switchToRegister} />
      </div>

      <div className="auth-form-panel register-panel">
        <RegisterForm onSwitchToLogin={switchToLogin} />
      </div>

      <div className="auth-banner-panel">
        <AuthBanner mode={authMode} />
      </div>
      {isVerifying && (
        <VerifyAccountModal
          status={verifyStatus}
          message={verifyMessage}
          onClose={() => {
            setIsVerifying(false);
            setSearchParams({ mode: "login" });
          }}
        />
      )}
    </div>
  );
};

export default AuthPage;
