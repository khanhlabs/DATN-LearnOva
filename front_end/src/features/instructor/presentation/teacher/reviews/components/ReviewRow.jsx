import { useState } from "react";
import { CheckCircle2, MessageSquare, Star } from "lucide-react";
import { formatReviewDate } from "../data/reviewsPageData";
import ReviewReplyModal from "./ReviewReplyModal";

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=1d4ed8&color=fff&name=Student";

const ReviewRow = ({ review, onReply }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasReply = Boolean(review.instructorReply);

  return (
    <article className="teacher-review-row">
      <div className="teacher-review-row__profile">
        <img src={review.avatar || DEFAULT_AVATAR} alt={review.userName} />
        <div>
          <strong>{review.userName}</strong>
        </div>
      </div>

      <div className="teacher-review-row__course">
        <span>{review.courseTitle}</span>
      </div>

      <div className="teacher-review-row__rating">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            size={16}
            fill={index < review.rating ? "#ff9800" : "none"}
            color="#ff9800"
          />
        ))}
      </div>

      <div className="teacher-review-row__body">
        <p className="teacher-review-row__comment">{review.comment || "-"}</p>

        {hasReply ? (
          <button type="button" className="teacher-review-row__replied-badge" onClick={() => setIsModalOpen(true)}>
            <CheckCircle2 size={14} /> Replied
          </button>
        ) : (
          <button type="button" className="teacher-review-row__reply-btn" onClick={() => setIsModalOpen(true)}>
            <MessageSquare size={14} /> Reply
          </button>
        )}
      </div>

      <div className="teacher-review-row__date">
        <time>{formatReviewDate(review.createdAt)}</time>
        {review.updatedAt && review.updatedAt !== review.createdAt && (
          <span className="teacher-review-row__edited">Đã chỉnh sửa</span>
        )}
      </div>

      {isModalOpen && (
        <ReviewReplyModal review={review} onClose={() => setIsModalOpen(false)} onSubmit={onReply} />
      )}
    </article>
  );
};

export default ReviewRow;
