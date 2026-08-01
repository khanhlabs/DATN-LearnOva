import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { FaUserGraduate, FaStar, FaRegHeart, FaHeart } from "react-icons/fa";
import defaultAvatar from "../../../../../assets/default_avatar.jpg";
import { getFileUrl } from "../../../../../api/PublicCourseApi.js";
import { addWishlistApi, removeWishlistApi, getWishlistApi } from "../../../../../api/WishlistApi.js";
import { useAuth } from "../../../../../hook/UseAuth.jsx";

function MainIntructor({
    activeTab,
    description,
    expertiseTags = [],
    courses = [],
    reviews = [],
    rating = 0,
    reviewCount = 0,
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [thumbnailUrls, setThumbnailUrls] = useState({});
    const [wishlistedIds, setWishlistedIds] = useState(new Set());

    useEffect(() => {
        courses.forEach((course) => {
            if (!course.thumbnailKey?.trim() || thumbnailUrls[course.courseId]) return;

            getFileUrl(course.thumbnailKey)
                .then((url) =>
                    setThumbnailUrls((prev) => ({ ...prev, [course.courseId]: url })),
                )
                .catch(() => {});
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courses]);

    useEffect(() => {
        if (!isAuthenticated || courses.length === 0) {
            setWishlistedIds(new Set());
            return;
        }

        getWishlistApi()
            .then((response) => {
                const items = response?.data || [];
                setWishlistedIds(new Set(items.map((item) => String(item.courseId))));
            })
            .catch(() => setWishlistedIds(new Set()));
    }, [isAuthenticated, courses]);

    const handleToggleWishlist = async (event, courseId) => {
        event.stopPropagation();

        if (!isAuthenticated) {
            toast.error(t("instructorDetailPage.loginToWishlist"));
            return;
        }

        const key = String(courseId);
        const isWishlisted = wishlistedIds.has(key);

        try {
            if (isWishlisted) {
                await removeWishlistApi(courseId);
                setWishlistedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
                toast.success(t("instructorDetailPage.removedFromWishlist"));
            } else {
                await addWishlistApi(courseId);
                setWishlistedIds((prev) => new Set(prev).add(key));
                toast.success(t("instructorDetailPage.addedToWishlist"));
            }
        } catch (err) {
            console.error("Failed to toggle wishlist", err);
            toast.error(t("instructorDetailPage.wishlistError"));
        }
    };

    const starBreakdown = [5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter((review) => review.rating === star).length;
        const width = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
        return { star, count, width };
    });

    return (
        <div className="content-left">
            {(activeTab === "overview" || activeTab === "about") && (
                <section className="section">
                    <h2 className="section-title">{t("instructorDetailPage.introduce")}</h2>
                    <p className="section-text">{description || t("instructorDetailPage.noBio")}</p>
                    {expertiseTags.length > 0 && (
                        <div className="profile-links">
                            {expertiseTags.map((tag) => (
                                <span key={tag} className="tag-link">{tag}</span>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {(activeTab === "overview" || activeTab === "courses") && (
                <section className="section">
                    <div className="section-header-course">
                        <h2 className="section-title">{t("instructorDetailPage.instructorCourses")}</h2>
                    </div>

                    {courses.length === 0 ? (
                        <p className="section-text">{t("instructorDetailPage.noCourses")}</p>
                    ) : (
                        <div className="courses-grid-new">
                            {(activeTab === "overview" ? courses.slice(0, 4) : courses).map((course) => (
                                <div
                                    key={course.courseId}
                                    className="course-card-new"
                                    onClick={() => navigate(`/learnova/courses/detail/${course.courseId}`)}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="course-image-box">
                                        <img
                                            src={thumbnailUrls[course.courseId] || defaultAvatar}
                                            alt={course.title}
                                            className="course-image-new"
                                        />
                                        <button
                                            className="wishlist-btn"
                                            onClick={(event) => handleToggleWishlist(event, course.courseId)}
                                        >
                                            {wishlistedIds.has(String(course.courseId)) ? (
                                                <FaHeart color="#e11d48" />
                                            ) : (
                                                <FaRegHeart />
                                            )}
                                        </button>
                                    </div>

                                    <div className="course-content-new">
                                        <h3 className="course-title-new">{course.title}</h3>

                                        <div className="course-meta-new">
                                            <div className="meta-item">
                                                <FaStar />
                                                <span>{course.rating.toFixed(1)}</span>
                                            </div>
                                            <div className="meta-divider"></div>
                                            <div className="meta-item">
                                                <span className="student-count">
                                                    <FaUserGraduate />
                                                    {course.studentCount}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="course-footer-new">
                                            <div className="price-new">
                                                {Number(course.basePrice).toLocaleString("vi-VN")}₫
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {activeTab === "reviews" && (
                <section className="review-section-new">
                    <div className="review-overview-card">
                        <div className="review-overview-left">
                            <h2>{t("instructorDetailPage.studentReviews")}</h2>
                            <p>{t("instructorDetailPage.reviewsSubtitle")}</p>

                            <div className="overall-rating">
                                <div className="overall-stars">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <FaStar key={i} />
                                    ))}
                                </div>
                                <span className="overall-score">{rating.toFixed(1)}</span>
                                <span className="overall-count">{t("instructorDetailPage.reviewsCountLabel", { count: reviewCount })}</span>
                            </div>
                        </div>

                        <div className="review-overview-right">
                            {starBreakdown.map((item) => (
                                <div className="rating-row" key={item.star}>
                                    <span>{item.star}</span>
                                    <FaStar className="mini-star-review" />
                                    <div className="rating-progress">
                                        <div
                                            className="rating-progress-fill"
                                            style={{ width: `${item.width}%` }}
                                        />
                                    </div>
                                    <span>{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="review-content-wrapper">
                        <div className="review-list-new">
                            {reviews.length === 0 ? (
                                <p className="section-text">{t("instructorDetailPage.noReviews")}</p>
                            ) : (
                                reviews.map((review, index) => (
                                    <div key={`${review.reviewerName}-${index}`} className="review-card-new">
                                        <div className="review-card-header">
                                            <div className="review-user">
                                                <img
                                                    src={review.reviewerAvatar?.trim() ? review.reviewerAvatar : defaultAvatar}
                                                    alt={review.reviewerName}
                                                    className="review-avatar-new"
                                                />
                                                <div>
                                                    <h4>{review.reviewerName}</h4>
                                                    <span>{review.courseTitle}</span>
                                                </div>
                                            </div>

                                            <div className="review-time-new">
                                                {new Date(review.createdAt).toLocaleDateString("en-US")}
                                            </div>
                                        </div>

                                        <div className="review-stars-new">
                                            {Array.from({ length: review.rating }).map((_, i) => (
                                                <FaStar key={i} color="#fbbf24" />
                                            ))}
                                        </div>

                                        <p className="review-text-new">{review.comment}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}

export default MainIntructor;
