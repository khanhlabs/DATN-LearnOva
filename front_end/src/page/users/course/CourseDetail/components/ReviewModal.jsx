import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaStar, FaTimes, FaRegCheckCircle } from "react-icons/fa";
import "../css/ReviewModal.css";

function ReviewModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setRating(5);
      setComment("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating < 1) {
      setError(t("courseDetail.reviewModal.ratingRequired"));
      return;
    }
    if (!comment.trim()) {
      setError(t("courseDetail.reviewModal.commentRequired"));
      return;
    }
    setError("");
    onSubmit({ rating, comment });
  };

  return (
    <div className="review-modal-overlay">
      <div className="review-modal-content">
        <button className="review-modal-close" onClick={onClose} aria-label="Close">
          <FaTimes />
        </button>

        <div className="congrats-badge">
          <FaRegCheckCircle className="congrats-icon" />
          <h3 className="review-modal-title">{t("courseDetail.reviewModal.congrats")}</h3>
        </div>

        <p className="review-modal-subtitle">
          {t("courseDetail.reviewModal.subtitle")}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="stars-rating-container">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={`star-icon ${(hoverRating || rating) >= star ? "filled" : ""}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              />
            ))}
          </div>

          <textarea
            className="review-textarea"
            placeholder={t("courseDetail.reviewModal.commentPlaceholder")}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (e.target.value.trim()) {
                setError("");
              }
            }}
            rows={4}
          />

          {error && (
            <div className="review-error-message">
              {error}
            </div>
          )}

          <div className="review-modal-actions">
            <button type="button" className="btn-cancel-review" onClick={onClose}>
              {t("courseDetail.reviewModal.later")}
            </button>
            <button type="submit" className="btn-submit-review" disabled={isSubmitting}>
              {isSubmitting ? t("courseDetail.reviewModal.submitting") : t("courseDetail.reviewModal.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewModal;
