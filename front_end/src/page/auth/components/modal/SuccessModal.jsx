import { CheckCircle2 } from "lucide-react";

const SuccessModal = ({ title, message, children, onClose, closeLabel = "Close" }) => (
    <div className="auth-modal-overlay">
        <div className="auth-modal auth-modal--success">
            <CheckCircle2 size={48} className="auth-modal-icon auth-modal-icon--success" />
            <h3>{title}</h3>
            <p>{message}</p>
            {children}
            {onClose && (
                <button type="button" className="auth-modal-btn auth-modal-btn--primary" onClick={onClose}>
                    {closeLabel}
                </button>
            )}
        </div>
    </div>
);

export default SuccessModal;
