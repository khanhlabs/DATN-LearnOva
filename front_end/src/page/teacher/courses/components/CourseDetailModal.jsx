import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, BookOpen, Clock, Users, Star, DollarSign, Globe,
  GraduationCap, Tag, CheckCircle, ChevronDown, ChevronRight,
  PlayCircle, FileText, Edit3, Circle, Loader2,
  User, MessageSquare, List, BarChart2, AlertTriangle,
} from "lucide-react";
import {
  getCourseForEdit,
  getCourseReviews,
  getCourseRatingSummary,
} from "../../../../api/teacher/CoursesApi.js";

const formatDuration = (totalSeconds) => {
  if (!totalSeconds) return "—";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
};

const formatPrice = (basePrice) => {
  if (basePrice === null || basePrice === undefined || basePrice === "") return "—";
  const n = Number(basePrice);
  if (n === 0) return "Free";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "—";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const TABS = [
  { id: "overview", label: "Overview", Icon: BarChart2 },
  { id: "description", label: "Description", Icon: FileText },
  { id: "curriculum", label: "Curriculum", Icon: List },
  { id: "reviews", label: "Reviews", Icon: Star },
];

const StarRow = ({ rating, size = 14 }) =>
  [1, 2, 3, 4, 5].map((s) => (
    <Star
      key={s}
      size={size}
      fill={s <= rating ? "currentColor" : "none"}
      strokeWidth={1.5}
    />
  ));

const CourseDetailModal = ({ course, onClose }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [detail, setDetail] = useState(null);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewFilter, setReviewFilter] = useState("newest");
  const [expandedSections, setExpandedSections] = useState({});

  const isActive = !course.isHidden;
  const isPublished = course.courseStatus === "PUBLISHED";
  const isRejected = course.courseStatus === "REJECTED";
  const statusModifier = {
    DRAFT: "draft",
    PENDING_REVIEW: "pending",
    PUBLISHED: "published",
    REJECTED: "rejected",
    ARCHIVED: "archived",
  }[course.courseStatus] ?? "draft";

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [detailRes, ratingRes, reviewsRes] = await Promise.allSettled([
          getCourseForEdit(course.id),
          getCourseRatingSummary(course.id),
          getCourseReviews(course.id),
        ]);

        if (detailRes.status === "fulfilled") {
          const data = detailRes.value;
          setDetail(data);
          if (data.sections?.length > 0) {
            setExpandedSections({ [data.sections[0].sectionId]: true });
          }
        }
        if (ratingRes.status === "fulfilled") setRatingSummary(ratingRes.value);
        if (reviewsRes.status === "fulfilled") {
          setReviews(Array.isArray(reviewsRes.value) ? reviewsRes.value : []);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [course.id]);

  const toggleSection = (sectionId) =>
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));

  const totalLessons = detail?.sections?.reduce((t, s) => t + s.lessons.length, 0) ?? course.modules;

  const sortedReviews = [...reviews].sort((a, b) => {
    if (reviewFilter === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
    if (reviewFilter === "highest") return b.rating - a.rating;
    if (reviewFilter === "lowest") return a.rating - b.rating;
    return 0;
  });

  const avgRating = ratingSummary?.averageRating != null
    ? Number(ratingSummary.averageRating).toFixed(1)
    : isPublished ? course.rating : "—";

  const totalReviews = ratingSummary?.totalReviews ?? reviews.length ?? 0;
  const ratingDist = ratingSummary?.ratingDistribution ?? null;

  return (
    <div className="cdm-overlay" onClick={onClose}>
      <div className="cdm" onClick={(e) => e.stopPropagation()}>

        {/* ── Thumbnail ─────────────────────────────────────── */}
        <div className="cdm__thumbnail-wrap">
          {course.image && course.image !== "/default-course-thumbnail.jpg" ? (
            <img src={course.image} alt={course.title} className="cdm__thumbnail-img" />
          ) : (
            <div className="cdm__thumbnail-placeholder">
              <BookOpen size={40} />
              <span>No thumbnail</span>
            </div>
          )}
          <button className="cdm__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* ── Header info ───────────────────────────────────── */}
        <div className="cdm__header-info">
          <div className="cdm__badges">
            <span className={`cdm__badge cdm__badge--${isActive ? "active" : "inactive"}`}>
              <Circle size={7} fill="currentColor" />
              {isActive ? "Active" : "Inactive"}
            </span>
            <span className={`cdm__badge cdm__badge--${statusModifier}`}>
              {course.courseStatus}
            </span>
            {detail?.level && (
              <span className="cdm__badge cdm__badge--level">
                <GraduationCap size={11} />
                {detail.level}
              </span>
            )}
            {detail?.language && (
              <span className="cdm__badge cdm__badge--lang">
                <Globe size={11} />
                {detail.language}
              </span>
            )}
          </div>
          <h2 className="cdm__title">{course.title}</h2>
          <p className="cdm__category">
            <Tag size={13} />
            {course.category}
          </p>
        </div>

        {isRejected && course.rejectionReason && (
          <div className="cdm__rejection-banner">
            <AlertTriangle size={16} />
            <div>
              <strong>Rejected by admin</strong>
              {course.rejectionReason}
            </div>
          </div>
        )}

        {/* ── Tab bar ───────────────────────────────────────── */}
        <div className="cdm__tabs">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`cdm__tab${activeTab === id ? " cdm__tab--active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={14} />
              {label}
              {id === "reviews" && totalReviews > 0 && (
                <span className="cdm__tab-badge">{totalReviews}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Body ──────────────────────────────────────────── */}
        <div className="cdm__body">
          {isLoading ? (
            <div className="cdm__loading">
              <Loader2 size={28} className="cdm__spinner" />
              <span>Loading course details…</span>
            </div>
          ) : (
            <>
              {/* ── OVERVIEW ── */}
              {activeTab === "overview" && (
                <div className="cdm__tab-content">
                  <div className="cdm__stats-grid">
                    {[
                      { Icon: Users,        color: "blue",   label: "Students",  value: isPublished ? course.studentCount : "—" },
                      { Icon: Clock,        color: "green",  label: "Duration",  value: formatDuration(course.totalDurationSeconds) },
                      { Icon: BookOpen,     color: "violet", label: "Lessons",   value: totalLessons },
                      { Icon: Star,         color: "gold",   label: "Rating",    value: avgRating },
                      { Icon: DollarSign,   color: "teal",   label: "Price",     value: formatPrice(detail?.basePrice ?? course.basePrice) },
                      { Icon: MessageSquare,color: "orange", label: "Reviews",   value: totalReviews },
                    ].map(({ Icon, color, label, value }) => (
                      <div key={label} className="cdm__stat-card">
                        <div className={`cdm__stat-icon cdm__stat-icon--${color}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <span>{label}</span>
                          <strong>{value}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="cdm__info-table">
                    {[
                      ["Level",     detail?.level    || "—"],
                      ["Language",  detail?.language || "—"],
                      ["Category",  course.category  || "—"],
                      ["Sections",  detail?.sections?.length ?? "—"],
                      ["Status",    course.courseStatus],
                      ["Created",   course.createdAgo],
                    ].map(([key, val]) => (
                      <div key={key} className="cdm__info-row">
                        <span>{key}</span>
                        <strong>{val}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── DESCRIPTION ── */}
              {activeTab === "description" && (
                <div className="cdm__tab-content">
                  {detail?.description ? (
                    <section className="cdm__section">
                      <h3 className="cdm__section-title">Description</h3>
                      <p className="cdm__description">{detail.description}</p>
                    </section>
                  ) : (
                    <div className="cdm__empty">No description added yet.</div>
                  )}

                  {detail?.whatYouLearn?.filter(Boolean).length > 0 && (
                    <section className="cdm__section">
                      <h3 className="cdm__section-title">What You'll Learn</h3>
                      <ul className="cdm__learn-list">
                        {detail.whatYouLearn.filter(Boolean).map((item, i) => (
                          <li key={i}>
                            <CheckCircle size={15} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {detail?.requirements?.filter(Boolean).length > 0 && (
                    <section className="cdm__section">
                      <h3 className="cdm__section-title">Requirements</h3>
                      <ul className="cdm__req-list">
                        {detail.requirements.filter(Boolean).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}

              {/* ── CURRICULUM ── */}
              {activeTab === "curriculum" && (
                <div className="cdm__tab-content">
                  {detail?.sections?.length > 0 ? (
                    <>
                      <p className="cdm__curriculum-summary">
                        {detail.sections.length} section{detail.sections.length !== 1 ? "s" : ""}
                        {" · "}
                        {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
                        {" · "}
                        {formatDuration(course.totalDurationSeconds)} total
                      </p>
                      <div className="cdm__curriculum">
                        {detail.sections.map((section) => (
                          <div key={section.sectionId} className="cdm__section-block">
                            <button
                              type="button"
                              className="cdm__section-header"
                              onClick={() => toggleSection(section.sectionId)}
                            >
                              <span className="cdm__section-chevron">
                                {expandedSections[section.sectionId]
                                  ? <ChevronDown size={15} />
                                  : <ChevronRight size={15} />}
                              </span>
                              <span className="cdm__section-name">
                                Section {section.sectionOrder}: {section.title}
                              </span>
                              <span className="cdm__section-count">
                                {section.lessons.length} lesson{section.lessons.length !== 1 ? "s" : ""}
                              </span>
                            </button>

                            {expandedSections[section.sectionId] && (
                              <div className="cdm__lessons">
                                {section.lessons.map((lesson) => (
                                  <div key={lesson.lessonId} className="cdm__lesson">
                                    <span className="cdm__lesson-icon">
                                      {lesson.videoKey
                                        ? <PlayCircle size={14} />
                                        : <FileText size={14} />}
                                    </span>
                                    <span className="cdm__lesson-title">
                                      {lesson.lessonOrder}. {lesson.title}
                                    </span>
                                    {lesson.durationSeconds ? (
                                      <span className="cdm__lesson-duration">
                                        <Clock size={11} />
                                        {formatDuration(lesson.durationSeconds)}
                                      </span>
                                    ) : null}
                                    {lesson.isPreview && (
                                      <span className="cdm__lesson-preview">Preview</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="cdm__empty">No curriculum added yet.</div>
                  )}
                </div>
              )}

              {/* ── REVIEWS ── */}
              {activeTab === "reviews" && (
                <div className="cdm__tab-content">
                  {ratingSummary ? (
                    <div className="cdm__rating-summary">
                      <div className="cdm__rating-big">
                        <strong>{Number(ratingSummary.averageRating ?? 0).toFixed(1)}</strong>
                        <div className="cdm__stars">
                          <StarRow rating={Math.round(ratingSummary.averageRating ?? 0)} size={16} />
                        </div>
                        <span>Course Rating</span>
                        <em>{ratingSummary.totalReviews ?? 0} reviews</em>
                      </div>

                      {ratingDist && (
                        <div className="cdm__rating-bars">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = ratingDist[star] ?? 0;
                            const total = ratingSummary.totalReviews || 1;
                            const pct = Math.round((count / total) * 100);
                            return (
                              <div key={star} className="cdm__rating-bar-row">
                                <span>
                                  {star} <Star size={11} fill="currentColor" />
                                </span>
                                <div className="cdm__rating-bar">
                                  <div
                                    className="cdm__rating-bar-fill"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : null}

                  <div className="cdm__reviews-toolbar">
                    <h3>Student Feedback</h3>
                    <select
                      value={reviewFilter}
                      onChange={(e) => setReviewFilter(e.target.value)}
                    >
                      <option value="newest">Newest</option>
                      <option value="highest">Highest Rated</option>
                      <option value="lowest">Lowest Rated</option>
                    </select>
                  </div>

                  {sortedReviews.length > 0 ? (
                    <div className="cdm__review-list">
                      {sortedReviews.map((review, idx) => (
                        <div key={review.reviewId ?? review.id ?? idx} className="cdm__review">
                          <div className="cdm__review-avatar">
                            {review.userAvatar ? (
                              <img src={review.userAvatar} alt={review.userName} />
                            ) : (
                              <User size={17} />
                            )}
                          </div>
                          <div className="cdm__review-content">
                            <div className="cdm__review-header">
                              <strong>{review.userName || "Anonymous"}</strong>
                              <div className="cdm__review-stars">
                                <StarRow rating={review.rating} size={12} />
                              </div>
                              <span className="cdm__review-time">{timeAgo(review.createdAt)}</span>
                            </div>
                            {review.comment && (
                              <p className="cdm__review-comment">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="cdm__empty">No reviews yet.</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────── */}
        <div className="cdm__footer">
          <button type="button" className="cdm__btn-cancel" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="cdm__btn-edit"
            onClick={() => {
              onClose();
              navigate(`/learnova/teacher/courses/edit/${course.id}`);
            }}
          >
            <Edit3 size={15} />
            Edit Course
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailModal;
