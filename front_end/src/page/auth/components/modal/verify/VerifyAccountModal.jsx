import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import "./VerifyAccountModal.css";

const VerifyAccountModal = ({ status, message, onClose }) => {
    const { t } = useTranslation();

    return (
        <div className="verify-modal-overlay">
            <div className="verify-modal">
                <div className="verify-modal__icon">
                    {status === "processing" && (
                        <Loader2 size={64} color="#2563eb" className="verify-modal__icon--spin" />
                    )}
                    {status === "success" && (
                        <CheckCircle2 size={68} color="#10b981" className="verify-modal__icon--pop" />
                    )}
                    {status === "error" && (
                        <XCircle size={68} color="#ef4444" className="verify-modal__icon--pop" />
                    )}
                </div>

                <h3 className={`verify-modal__title verify-modal__title--${status}`}>
                    {status === "success" && t("auth.verify.successTitle")}
                    {status === "error" && t("auth.verify.errorTitle")}
                    {status === "processing" && t("auth.verify.processingTitle")}
                </h3>

                <p className="verify-modal__message">{message}</p>

                {status === "success" && (
                    <p className="verify-modal__hint">
                        {t("auth.verify.redirecting")}
                    </p>
                )}

                {status === "error" && (
                    <button className="verify-modal__close-btn" onClick={onClose}>
                        {t("auth.verify.closeAndGoBack")}
                    </button>
                )}
            </div>
        </div>
    );
};

export default VerifyAccountModal;
