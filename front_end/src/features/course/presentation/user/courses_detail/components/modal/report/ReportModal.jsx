import { useEffect, useState } from "react";
import { FaFlag, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import "./ReportModal.css";

/** Course / video quality → admin + instructor notified. */
const COURSE_ISSUE_OPTIONS = [
  "VIDEO_ERROR",
  "AUDIO_ERROR",
  "BROKEN_DOCUMENT",
  "OUTDATED_CONTENT",
  "INCORRECT_CONTENT",
  "OTHER_COURSE_ISSUE",
];

/** Spam / fraud / policy → admin only. */
const POLICY_VIOLATION_OPTIONS = [
  "SPAM",
  "FRAUD",
  "COPYRIGHT",
  "SENSITIVE_CONTENT",
  "OTHER_VIOLATION",
];

const DESCRIPTION_REQUIRED = new Set([
  "OTHER_COURSE_ISSUE",
  "OTHER_VIOLATION",
]);

function ReportCourseModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const { t } = useTranslation();
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
      setError(t("courseDetail.report.descriptionRequiredError"));
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
          aria-label={t("courseDetail.report.close")}
        >
          <FaTimes />
        </button>

        <div className="report-course-modal-header">
          <span className="report-course-modal-icon">
            <FaFlag />
          </span>
          <h3 id="report-course-title">{t("courseDetail.report.title")}</h3>
        </div>

        <p className="report-course-modal-subtitle">
          {t("courseDetail.report.subtitle")}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="report-course-reasons-grid">
            <fieldset className="report-course-reasons">
              <legend>{t("courseDetail.report.courseIssueGroup")}</legend>
              {COURSE_ISSUE_OPTIONS.map((value) => (
                <label key={value} className="report-course-reason-option">
                  <input
                    type="radio"
                    name="report-reason"
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value)}
                  />
                  <span>{t(`courseDetail.report.${value}`)}</span>
                </label>
              ))}
            </fieldset>

            <fieldset className="report-course-reasons">
              <legend>{t("courseDetail.report.policyGroup")}</legend>
              {POLICY_VIOLATION_OPTIONS.map((value) => (
                <label key={value} className="report-course-reason-option">
                  <input
                    type="radio"
                    name="report-reason"
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value)}
                  />
                  <span>{t(`courseDetail.report.${value}`)}</span>
                </label>
              ))}
            </fieldset>
          </div>

          <label className="report-course-desc-label" htmlFor="report-description">
            {needsDescription
              ? t("courseDetail.report.descriptionRequired")
              : t("courseDetail.report.descriptionOptional")}
          </label>
          <textarea
            id="report-description"
            className="report-course-textarea"
            placeholder={t("courseDetail.report.placeholder")}
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
              {t("courseDetail.report.cancel")}
            </button>
            <button
              type="submit"
              className="report-course-btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("courseDetail.report.sending")
                : t("courseDetail.report.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportCourseModal;
