import { LockKeyhole, Megaphone, X } from "lucide-react";
import { useState } from "react";
import "../ViolationReports";

const DEFAULT_WARN_MESSAGE =
  "Please review and update the reported video content as soon as possible.";

/**
 * Modal for warn / hide actions.
 * kind: "warn" | "hide"
 */
const ModerationActionModal = ({
  kind,
  report,
  isSubmitting,
  onConfirm,
  onCancel,
}) => {
  const [message, setMessage] = useState(DEFAULT_WARN_MESSAGE);
  const isWarn = kind === "warn";
  const target = report?.lessonTitle
    ? `${report.courseTitle} · ${report.lessonTitle}`
    : report?.courseTitle || "this course";

  return (
    <div className="violation-action-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="violation-action-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="violation-action-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="violation-action-close"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className={`violation-action-icon ${isWarn ? "warn" : "hide"}`}>
          {isWarn ? <Megaphone size={28} /> : <LockKeyhole size={28} />}
        </div>

        <h2 id="violation-action-title">
          {isWarn ? "Notify instructor" : "Hide course from students"}
        </h2>

        <p className="violation-action-desc">
          {isWarn ? (
            <>
              The instructor of <strong>{target}</strong> will be notified to
              review and fix the reported video content.
            </>
          ) : (
            <>
              Course <strong>{target}</strong> will be hidden from the public
              catalog. Open reports for this course will be marked resolved, and
              the instructor will be notified.
            </>
          )}
        </p>

        {isWarn ? (
          <label className="violation-action-field">
            <span>Message to instructor</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              disabled={isSubmitting}
              placeholder={DEFAULT_WARN_MESSAGE}
            />
          </label>
        ) : null}

        <div className="violation-action-actions">
          <button
            type="button"
            className="violation-report-btn ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`violation-report-btn${isWarn ? "" : " danger"}`}
            onClick={() => onConfirm(isWarn ? message.trim() : undefined)}
            disabled={isSubmitting || (isWarn && !message.trim())}
          >
            {isSubmitting
              ? isWarn
                ? "Sending…"
                : "Hiding…"
              : isWarn
                ? "Send notification"
                : "Confirm hide"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModerationActionModal;
export { DEFAULT_WARN_MESSAGE };
