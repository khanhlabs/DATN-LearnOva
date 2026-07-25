import { useState } from "react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

const CourseReviews = ({ course, reviewsData }) => {
    const { t } = useTranslation();

    if (!course || !reviewsData) {
        return <p>{t("profile.learningDetail.loadingReviews")}</p>;
    }
    const REVIEWS_PER_PAGE = 3;

    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(
        (reviewsData.reviews?.length || 0) / REVIEWS_PER_PAGE
    );

    const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
    const endIndex = startIndex + REVIEWS_PER_PAGE;

    const currentReviews = reviewsData.reviews.slice(startIndex, endIndex);

    return (
        <section className="learning-content-panel learning-review-panel">
            <div className="learning-review-summary">
                <strong>{reviewsData.averageRating}</strong>

                <div>
                    <div>
                        {[1, 2, 3, 4, 5].map((item) => (
                            <Star key={item} size={18} fill="currentColor" />
                        ))}
                    </div>

                    <p>
                        {t("profile.learningDetail.reviewsBasedOn", { count: reviewsData.reviewCount })}
                    </p>
                </div>
            </div>

            <div className="learning-review-list">
                {currentReviews.map((review) => (
                    <article key={review.reviewId}>
                        <div>
                            <strong>{review.userName}</strong>
                            <span>{review.rating}/5</span>
                        </div>

                        <p>{review.comment}</p>
                    </article>
                ))}
            </div>
            {totalPages > 1 && (
                <div className="review-pagination">

                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                    >
                        {t("profile.learningDetail.previous")}
                    </button>

                    {Array.from({ length: totalPages }, (_, index) => (
                        <button
                            key={index}
                            className={currentPage === index + 1 ? "active" : ""}
                            onClick={() => setCurrentPage(index + 1)}
                        >
                            {index + 1}
                        </button>
                    ))}

                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                    >
                        {t("profile.learningDetail.next")}
                    </button>

                </div>
            )}
        </section>
    );
};

export default CourseReviews;