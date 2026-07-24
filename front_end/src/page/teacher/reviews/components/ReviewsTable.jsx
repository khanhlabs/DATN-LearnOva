import { reviewsTableColumns } from "../reviewsPageData.js";
import ReviewRow from "./ReviewRow.jsx";

const ReviewsTable = ({ reviews, onReply }) => (
  <div className="teacher-reviews-panel">
    <div className="teacher-reviews-table-head">
      {reviewsTableColumns.map((column) => (
        <span key={column}>{column}</span>
      ))}
    </div>

    {reviews.length === 0 ? (
      <div className="teacher-reviews-empty">No reviews found.</div>
    ) : (
      reviews.map((review) => <ReviewRow key={review.reviewId} review={review} onReply={onReply} />)
    )}
  </div>
);

export default ReviewsTable;
