import { useState } from "react";
import { Send, Star, X } from "lucide-react";

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=1d4ed8&color=fff&name=Student";

const ReviewReplyModal = ({ review, onClose, onSubmit }) => {
  const [draft, setDraft] = useState(review.instructorReply || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = Boolean(review.instructorReply);

  const handleSubmit = async () => {
    if (!draft.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(review.reviewId, draft.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="review-reply-modal-overlay" onClick={onClose}>
      <div className="review-reply-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="review-reply-modal__close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <h2 className="review-reply-modal__title">{isEditMode ? "Edit your reply" : "Reply to review"}</h2>

        <div className="review-reply-modal__review">
          <div className="review-reply-modal__profile">
            <img src={review.avatar || DEFAULT_AVATAR} alt={review.userName} />
            <div>
              <strong>{review.userName}</strong>
              <div className="review-reply-modal__rating">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} size={14} fill={index < review.rating ? "#ff9800" : "none"} color="#ff9800" />
                ))}
              </div>
            </div>
          </div>
          <p className="review-reply-modal__comment">{review.comment || "-"}</p>
        </div>

        <textarea
          className="review-reply-modal__textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a public reply to this review…"
          rows={4}
          autoFocus
        />

        <div className="review-reply-modal__actions">
          <button type="button" className="review-reply-modal__cancel" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="button" className="review-reply-modal__submit" onClick={handleSubmit} disabled={isSubmitting || !draft.trim()}>
            <Send size={14} /> {isSubmitting ? "Sending…" : isEditMode ? "Save changes" : "Send reply"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewReplyModal;
