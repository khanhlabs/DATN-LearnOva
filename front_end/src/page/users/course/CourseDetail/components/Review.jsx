import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdStar } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { FaRegCommentDots } from "react-icons/fa";
import {
    createReviewApi,
    updateReviewApi,
    deleteReviewApi
} from "../../../../../api/ReviewApi.js";
import { toast } from "react-toastify";
import { FaCheck } from "react-icons/fa";

function ReviewsTab({
                        reviewsData,
                        setReviewsData,
                        currentUserId,
                        ratingSummary,
                        reviewQuery,
                        handleDeleteReview,
                        handleSearchReviews,
                        ratingFilter,
                        handleRatingFilter,
                        currentReviewPage,
                        setCurrentReviewPage,
                        reviewsPerPage,
                        isCourseCompleted,
                        hasReviewed,
                        openReviewModal
                    }) {
    const { t, i18n } = useTranslation();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 30000);
        return () => window.clearInterval(timer);
    }, []);

    const formatReviewTime = (value) => {
        if (!value) return t("courseDetail.reviews.justNow");

        const timestamp = new Date(value).getTime();
        if (!Number.isFinite(timestamp)) return t("courseDetail.reviews.justNow");

        const elapsed = Math.max(0, now - timestamp);
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (seconds < 60) {
            return t("courseDetail.reviews.secondsAgo", { count: Math.max(1, seconds) });
        }
        if (minutes < 60) {
            return t("courseDetail.reviews.minutesAgo", { count: minutes });
        }
        if (hours < 24) {
            return t("courseDetail.reviews.hoursAgo", { count: hours });
        }

        return new Intl.DateTimeFormat(
            i18n.language === "vi" ? "vi-VN" : "en-US",
            { day: "2-digit", month: "2-digit", year: "numeric" }
        ).format(new Date(timestamp));
    };

    // Toggle đóng mở menu 3 chấm
    const toggleMenu = (id) => {
        setOpenMenuId(prev => (prev === id ? null : id));
    };
    const filteredReviews = (reviewsData || []).filter((r) => {
        const matchRating =
            ratingFilter === "all" ||
            Number(ratingFilter) === r.rating;
        const q = reviewQuery.toLowerCase().trim();
        const commentText = r.comment || r.text || "";
        const accountName = r.userName || r.name || "";
        const matchSearch =
            !q ||
            commentText.toLowerCase().includes(q) ||
            accountName.toLowerCase().includes(q);

        return matchRating && matchSearch;
    });
    const startIndex = (currentReviewPage - 1) * reviewsPerPage;

    const pageItems = filteredReviews.slice(
        startIndex,
        startIndex + reviewsPerPage
    );
    const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
    const hasNoReviews =
        !reviewsData || reviewsData.length === 0;
    const isNoResult =
        !hasNoReviews &&
        filteredReviews.length === 0;

    return (
        <div className="reviews-section">
            <div className="rating-summary">
                {/* LEFT */}
                <div className="rating-left">
                    <div className="rating-number">
                        {ratingSummary?.averageRating?.toFixed(1) || "0.0"}
                    </div>

                    <div className="rating-stars">
                        {Array.from({ length: 5 }).map((_, i) => {
                            const avg = ratingSummary?.averageRating || 0;

                            return (
                                <MdStar
                                    key={i}
                                    style={{
                                        color: i < Math.round(avg) ? "#f59e0b" : "#ddd"
                                    }}
                                />
                            );
                        })}
                    </div>

                    <div className="rating-label">
                        {t("courseDetail.reviews.courseRating", { count: ratingSummary?.totalReviews || 0 })}
                    </div>
                </div>

                {/* RIGHT */}
                <div className="rating-right">
                    <div className="rating-bars">
                        {[5, 4, 3, 2, 1].map(star => {
                            const count = reviewsData.filter(r => r.rating === star).length;
                            const total = reviewsData.length || 1;
                            const percent = (count / total) * 100;

                            return (
                                <div key={star} className="rating-row">
                                    <span className="row-label">{star}★</span>

                                    <div className="row-bar">
                                        <div
                                            className="row-fill"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>

                                    <span className="row-percent">
                            {Math.round(percent)}%
                        </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            {/* REVIEW FORM ACTION */}


            <h3 className="reviews-title">{t("courseDetail.reviews.title")}</h3>

            <div className="review-controls">


                <div className="review-filter">

                    <select value={ratingFilter} onChange={handleRatingFilter}>
                        <option value="all">{t("courseDetail.reviews.allRatings")}</option>
                        <option value={5}>{t("courseDetail.reviews.stars", { count: 5 })}</option>
                        <option value={4}>{t("courseDetail.reviews.stars", { count: 4 })}</option>
                        <option value={3}>{t("courseDetail.reviews.stars", { count: 3 })}</option>
                    </select>
                </div>
            </div>

            {isNoResult ? (
                <div className="no-search-result">
                    <FaRegCommentDots size={40} color="#999" />
                    <h3>{t("courseDetail.reviews.noResultsTitle")}</h3>
                    <p>{t("courseDetail.reviews.noResultsSub")}</p>
                </div>
            ) : (
                <div className="reviews-list">
                    {pageItems.map(r => {
                    const reviewOwnerId =
                        r.userId ||
                        r.idUser ||
                        r.id ||
                        (r.user && r.user.id);
                    const isOwner =
                        currentUserId &&
                        reviewOwnerId &&
                        String(currentUserId) === String(reviewOwnerId);



                    const displayComment = r.comment || r.text || "";
                    const displayName = r.userName || r.name || "Anonymous";
                    const displayInitials = r.initials || displayName.charAt(0).toUpperCase();
                    const reviewTime = r.updatedAt || r.createdAt;
                    const isEdited = r.edited === true || (
                        r.createdAt && r.updatedAt &&
                        new Date(r.updatedAt).getTime() > new Date(r.createdAt).getTime()
                    );

                    return (
                        <div key={r.reviewId} className="review-item">
                            <div className="review-avatar">{displayInitials}</div>
                            <div className="review-body">
                                <div className="review-head">
                                    <div className="review-name">{displayName}</div>
                                    <div className="review-meta">
                                        <span className="review-stars-in">
                                            {Array.from({ length: r.rating || 5 }).map((_, i) => (
                                                <MdStar key={i} className="star small" />
                                            ))}
                                        </span>
                                        <span className="review-time">{formatReviewTime(reviewTime)}</span>
                                        {isEdited && (
                                            <span className="review-edited">
                                                {t("courseDetail.reviews.edited")}
                                            </span>
                                        )}
                                    </div>

                                    {/* CHỈ HIỂN THỊ NÚT 3 CHẤM NẾU ĐÚNG CHỦ SỞ HỮU ĐANG ĐĂNG NHẬP */}
                                    {isOwner && (
                                        <div className="menu-wrapper">
                                            <button
                                                className="menu-btn-course"
                                                onClick={() => toggleMenu(r.reviewId)}
                                            >
                                                ⋯
                                            </button>

                                            {openMenuId === r.reviewId && (
                                                <div className="dropdown-menu">
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(r.reviewId);
                                                            setEditText(displayComment);
                                                            setOpenMenuId(null);
                                                        }}
                                                    >
                                                        {t("courseDetail.reviews.edit")}
                                                    </button>


                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await handleDeleteReview(r.reviewId);

                                                                toast.success(t("courseDetail.reviews.deleteSuccess"), {
                                                                    position: "top-right",
                                                                    autoClose: 2000
                                                                });

                                                            } catch (err) {
                                                                toast.error(t("courseDetail.reviews.deleteFailed"), {
                                                                    position: "top-right",
                                                                    autoClose: 2000
                                                                });

                                                                console.log(err);
                                                            }

                                                            setOpenMenuId(null);
                                                        }}
                                                    >
                                                        {t("courseDetail.reviews.delete")}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="review-text">
                                    {editingId === r.reviewId ? (
                                        <div className="edit-box">
                                            <textarea
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                            />

                                            <div className="edit-actions">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await updateReviewApi({
                                                                reviewId: r.reviewId,
                                                                rating: r.rating,
                                                                comment: editText
                                                            });

                                                            setReviewsData(prev =>
                                                                prev.map(item =>
                                                                    item.reviewId === r.reviewId
                                                                        ? {
                                                                            ...item,
                                                                            comment: editText,
                                                                            text: editText,
                                                                            updatedAt: new Date().toISOString(),
                                                                            edited: true
                                                                        }
                                                                        : item
                                                                )
                                                            );

                                                            setEditingId(null);

                                                            toast.success(t("courseDetail.reviews.updateSuccess"), {
                                                                position: "top-right",
                                                                autoClose: 2000,
                                                                className: "toast-green",
                                                                progressClassName: "toast-progress-white",
                                                                icon: <FaCheck color="#22c55e"/>
                                                            });

                                                        } catch (err) {
                                                            console.log("Lỗi cập nhật review:", err);

                                                            toast.error(t("courseDetail.reviews.updateFailed"), {
                                                                position: "top-right",
                                                                autoClose: 2000
                                                            });
                                                        }
                                                    }}
                                                >
                                                    {t("courseDetail.reviews.save")}
                                                </button>

                                                <button onClick={() => setEditingId(null)}>
                                                    {t("courseDetail.reviews.cancel")}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        displayComment
                                    )}
                                </div>

                                {r.instructorReply && (
                                    <div className="review-instructor-reply">
                                        <strong>Instructor reply</strong>
                                        <p>{r.instructorReply}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            )}

            <div className="reviews-pagination">
                <button
                    disabled={currentReviewPage === 1}
                    onClick={() =>
                        setCurrentReviewPage(p => Math.max(1, p - 1))
                    }
                >
                    ‹
                </button>

                <span>
        {t("courseDetail.reviews.page", { current: currentReviewPage, total: totalPages || 1 })}
    </span>

                <button
                    disabled={currentReviewPage >= totalPages}
                    onClick={() =>
                        setCurrentReviewPage(p =>
                            Math.min(totalPages, p + 1)
                        )
                    }
                >
                    ›
                </button>
            </div>
        </div>
    );
}

export default ReviewsTab;
