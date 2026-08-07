import { AlertTriangle } from "lucide-react";

const WarningModal = ({ title, message, onContinue, onCancel }) => (
    <div className="auth-modal-overlay">
        <div className="auth-modal auth-modal--warning">
            <AlertTriangle size={48} className="auth-modal-icon auth-modal-icon--warning" />
            <h3>{title}</h3>
            <p>{message}</p>
            <div className="auth-modal-actions">
                <button type="button" className="auth-modal-btn auth-modal-btn--ghost" onClick={onCancel}>
                    Cancel
                </button>
                <button type="button" className="auth-modal-btn auth-modal-btn--primary" onClick={onContinue}>
                    Continue Anyway
                </button>
            </div>
        </div>
    </div>
);

export default WarningModal;
