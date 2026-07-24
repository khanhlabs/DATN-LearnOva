import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { MessageSquare, Star } from "lucide-react";
import ReviewsTable from "./components/ReviewsTable.jsx";
import ReviewsToolbar from "./components/ReviewsToolbar.jsx";
import { getMyReviews, replyToReview } from "../../../api/teacher/ReviewApi.js";
import { buildCourseFilterOptions, filterReviews } from "./reviewsPageUtils.js";
import "./ReviewsPage.css";

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("ALL");

  useEffect(() => {
    getMyReviews()
      .then(setReviews)
      .catch(() => toast.error("Failed to load reviews."))
      .finally(() => setIsLoading(false));
  }, []);

  const courseFilterOptions = useMemo(() => buildCourseFilterOptions(reviews), [reviews]);

  const filteredReviews = useMemo(
    () => filterReviews({ reviews, query, ratingFilter, courseFilter }),
    [reviews, query, ratingFilter, courseFilter]
  );

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  const handleReply = async (reviewId, reply) => {
    try {
      await replyToReview(reviewId, reply);
      setReviews((prev) =>
        prev.map((r) =>
          r.reviewId === reviewId ? { ...r, instructorReply: reply, repliedAt: new Date().toISOString() } : r
        )
      );
      toast.success("Reply posted.");
    } catch {
      toast.error("Failed to post reply. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <section className="teacher-page teacher-reviews-page">
        <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
          Loading reviews...
        </div>
      </section>
    );
  }

  return (
    <section className="teacher-page teacher-reviews-page">
      <div className="teacher-reviews-summary">
        <div className="teacher-reviews-summary__item">
          <span className="teacher-reviews-summary__icon">
            <Star size={20} fill="#ff9800" color="#ff9800" />
          </span>
          <div>
            <strong>{averageRating.toFixed(1)}</strong>
            <span>Average rating</span>
          </div>
        </div>
        <div className="teacher-reviews-summary__item">
          <span className="teacher-reviews-summary__icon teacher-reviews-summary__icon--blue">
            <MessageSquare size={20} />
          </span>
          <div>
            <strong>{reviews.length}</strong>
            <span>Total reviews</span>
          </div>
        </div>
      </div>

      <ReviewsToolbar
        query={query}
        onQueryChange={setQuery}
        ratingFilter={ratingFilter}
        onRatingFilterChange={setRatingFilter}
        courseFilter={courseFilter}
        onCourseFilterChange={setCourseFilter}
        courseFilterOptions={courseFilterOptions}
      />

      <ReviewsTable reviews={filteredReviews} onReply={handleReply} />
    </section>
  );
};

export default ReviewsPage;
