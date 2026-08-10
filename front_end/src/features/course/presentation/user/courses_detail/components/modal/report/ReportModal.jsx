import { useEffect, useState } from "react";
import { FaFlag, FaTimes } from "react-icons/fa";
import "./ReportModal";

/** Course / video quality → admin + instructor notified. */
const COURSE_ISSUE_OPTIONS = [
  { value: "VIDEO_ERROR", label: "Video error / cannot play" },
  { value: "AUDIO_ERROR", label: "Audio error" },
  { value: "BROKEN_DOCUMENT", label: "Broken document / resource" },
  { value: "OUTDATED_CONTENT", label: "Outdated content" },
  { value: "INCORRECT_CONTENT", label: "Incorrect course content" },
  { value: "OTHER_COURSE_ISSUE", label: "Other course issue" },
];

/** Spam / fraud / policy → admin only. */
const POLICY_VIOLATION_OPTIONS = [
  { value: "SPAM", label: "Spam / advertising" },
  { value: "FRAUD", label: "Fraud / scam video" },
  { value: "COPYRIGHT", label: "Copyright violation" },
  { value: "SENSITIVE_CONTENT", label: "Sensitive / inappropriate content" },
  { value: "OTHER_VIOLATION", label: "Other policy violation" },
];

const DESCRIPTION_REQUIRED = new Set([
  "OTHER_COURSE_ISSUE",
  "OTHER_VIOLATION",
]);

function ReportCourseModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [reason, setReason] = useState("VIDEO_ERROR");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("VIDEO_ERROR");
      setDescription("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const needsDescription = DESCRIPTION_REQUIRED.has(reason);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (needsDescription && !description.trim()) {
      setError("Please describe the issue for this reason.");
      return;
    }
    setError("");
    onSubmit({ reason, description: description.trim() });
  };

  return (
    <div className="report-course-modal-overlay" onClick={onClose}>
      <div
        className="report-course-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-course-title"
      >
        <button
          type="button"
          className="report-course-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <FaTimes />
        </button>

        <div className="report-course-modal-header">
          <span className="report-course-modal-icon">
            <FaFlag />
          </span>
          <h3 id="report-course-title">Report this course</h3>
        </div>

        <p className="report-course-modal-subtitle">
          Course or video problems are sent to the instructor and admins.
          Spam, fraud, or policy violations go to admins only.
        </p>

        <form onSubmit={handleSubmit}>
          <fieldset className="report-course-reasons">
            <legend>Course / video issue</legend>
            {COURSE_ISSUE_OPTIONS.map((option) => (
              <label key={option.value} className="report-course-reason-option">
                <input
                  type="radio"
                  name="report-reason"
                  value={option.value}
                  checked={reason === option.value}
                  onChange={() => setReason(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>

          <fieldset className="report-course-reasons">
            <legend>Spam / fraud / policy (admins only)</legend>
            {POLICY_VIOLATION_OPTIONS.map((option) => (
              <label key={option.value} className="report-course-reason-option">
                <input
                  type="radio"
                  name="report-reason"
                  value={option.value}
                  checked={reason === option.value}
                  onChange={() => setReason(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>

          <label className="report-course-desc-label" htmlFor="report-description">
            Description {needsDescription ? "(required)" : "(optional)"}
          </label>
          <textarea
            id="report-description"
            className="report-course-textarea"
            placeholder="Describe the problem..."
            value={description}
            maxLength={500}
            rows={4}
            onChange={(e) => {
              setDescription(e.target.value);
              if (e.target.value.trim()) setError("");
            }}
          />
          <div className="report-course-char-count">{description.length}/500</div>

          {error && <div className="report-course-error">{error}</div>}

          <div className="report-course-actions">
            <button type="button" className="report-course-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="report-course-btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Submit report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportCourseModal;
