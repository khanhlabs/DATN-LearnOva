import { useState } from "react";
import { CheckCircle, EyeOff, XCircle } from "lucide-react";

const actionCopy = {
  approve: {
    icon: CheckCircle,
    title: "Approve course?",
    description: "This course will be published and become visible to learners.",
    confirmLabel: "Approve",
    loadingLabel: "Approving...",
    iconClassName: "approvalConfirmIcon approvalConfirmIcon--approve",
    buttonClassName: "approvalBtnApprove",
  },
  hide: {
    icon: EyeOff,
    title: "Hide course?",
    description: "This course will be hidden from public course listings.",
    confirmLabel: "Hide",
    loadingLabel: "Hiding...",
    iconClassName: "approvalConfirmIcon approvalConfirmIcon--hide",
    buttonClassName: "approvalBtnHide",
  },
  reject: {
    icon: XCircle,
    title: "Reject course?",
    description: "Tell the instructor what needs to change before this course can be approved.",
    confirmLabel: "Reject",
    loadingLabel: "Rejecting...",
    iconClassName: "approvalConfirmIcon approvalConfirmIcon--hide",
    buttonClassName: "approvalBtnReject",
  },
};

const ApprovalConfirmModal = ({ action, courseTitle, isSubmitting, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  const copy = actionCopy[action] ?? actionCopy.approve;
  const Icon = copy.icon;
  const isReject = action === "reject";
  const canConfirm = !isReject || reason.trim().length > 0;

  return (
    <div className="approvalBackdrop" role="presentation" onClick={onCancel}>
      <div
        className="approvalConfirmModal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={copy.iconClassName}>
          <Icon size={32} />
        </div>

        <h2 className="approvalConfirmTitle">{copy.title}</h2>
        <p className="approvalConfirmDesc">
          <strong>{courseTitle}</strong>
          <br />
          {copy.description}
        </p>

        {isReject && (
          <textarea
            className="approvalRejectReasonInput"
            placeholder="Explain why this course is being rejected..."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            disabled={isSubmitting}
          />
        )}

        <div className="approvalConfirmActions">
          <button
            type="button"
            className="approvalBtnCancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={copy.buttonClassName}
            onClick={() => onConfirm(isReject ? reason.trim() : undefined)}
            disabled={isSubmitting || !canConfirm}
          >
            {isSubmitting ? copy.loadingLabel : copy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalConfirmModal;
