import { useMemo, useState, useEffect } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  Heart,
  HelpCircle,
  Link as LinkIcon,
  MessageCircle,
  Play,
  ShoppingCart,
  Star,
  User,
  Users,
  Edit2,
  Trash2,
} from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { FaFacebookF, FaLinkedinIn, FaTwitter } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { getCourseDetailApi } from "../../../../../../api/CourseApi";
import { getCourseReviewsApi, createReviewApi, updateReviewApi, deleteReviewApi } from "../../../../../../api/ReviewApi";
import { checkEnrollment } from "../../../../../../api/EnrollmentApi";
import { removeWishlistApi } from "../../../../../../api/WishlistApi";
import { toast } from "react-toastify";
import { useAuth } from "../../../../../../hook/UseAuth";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../../../../../../assets/default_user_avatar.jpg";

const tabIcons = {
  overview: BookOpen,
  curriculum: FileText,
  instructor: Users,
  reviews: Star,
};

const FavoriteCourseDetailSection = ({ course, onBack, onStartCourse }) => {
  const { t } = useTranslation();

  const FAVORITE_DETAIL_TABS = [
    { id: "overview", label: t("profile.favoriteDetail.tabOverview") },
    { id: "curriculum", label: t("profile.favoriteDetail.tabCurriculum") },
    { id: "instructor", label: t("profile.favoriteDetail.tabInstructor") },
    { id: "reviews", label: t("profile.favoriteDetail.tabReviews") },
  ];

  const [activeTab, setActiveTab] = useState("overview");
  const [detail, setDetail] = useState(null);
  const [reviewsList, setReviewsList] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState({});
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const REVIEWS_PER_PAGE = 3;

  const [currentPage, setCurrentPage] = useState(1);

  const handleContinueLearning = () => {
    const courseId = course.courseId || course.id;

    navigate(`/learnova/user/CoursesDetail/${courseId}`);
  };
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "", isEditing: false, reviewId: null });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchReviews = async () => {
    try {
      const reviewsData = await getCourseReviewsApi(course.courseId || course.id);
      setReviewsList(reviewsData?.content || reviewsData || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        setLoading(true);
        const data = await getCourseDetailApi(course.courseId || course.id);
        setDetail(data);

        try {
          const enrolled = await checkEnrollment(course.courseId || course.id);
          console.log("Course Detail:", data);
          console.log("Instructor:", data.instructor);
          setIsEnrolled(enrolled);
        } catch (err) {
          console.error("Error checking enrollment:", err);
        }

        await fetchReviews();
      } catch (error) {
        console.error("Failed to load course details:", error);
        toast.error(t("profile.favoriteDetail.loadFailed"));
      } finally {
        setLoading(false);
      }
    };
    if (course && (course.courseId || course.id)) {
      fetchCourseDetail();
    }
  }, [course]);

  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const handleRemoveFavorite = async () => {
    try {
      await removeWishlistApi(course.courseId || course.id);
      toast.success(t("profile.favoriteDetail.removedSuccess"));
      if (onBack) onBack();
    } catch (err) {
      toast.error(t("profile.favoriteDetail.removeFailed"));
    }
  };

  const handleCopyLink = () => {
    const url = window.location.origin + `/courses/${course.courseId || course.id}`;
    navigator.clipboard.writeText(url);
    toast.success(t("profile.favoriteDetail.linkCopied"));
  };

  const scrollToPageTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <div className="favorite-flow-page p-8 text-center">{t("profile.favoriteDetail.loading")}</div>;
  }

  if (!detail) {
    return <div className="favorite-flow-page p-8 text-center text-red-500">{t("profile.favoriteDetail.loadFailed")}</div>;
  }

  const courseInfo = [
    { icon: Users, label: t("profile.favoriteDetail.level"), value: detail.level, badge: true },
    { icon: BookOpen, label: t("profile.favoriteDetail.numberOfLessons"), value: t("profile.favoriteDetail.lessonsCount", { count: detail.lessonCount || 0 }) },
    { icon: Clock, label: t("profile.favoriteDetail.duration"), value: `${Math.floor((detail.totalDurationSeconds || 0)/3600)}h ${Math.floor(((detail.totalDurationSeconds || 0)%3600)/60)}m` },
    { icon: Globe, label: t("profile.favoriteDetail.language"), value: detail.language || "Vietnamese" },
    { icon: FileText, label: t("profile.favoriteDetail.category"), value: detail.categoryName },
  ];

  const userHasReviewed = reviewsList.some(r => r.studentId === currentUser?.id || r.studentName === currentUser?.fullName);
  const totalPages = Math.ceil(reviewsList.length / REVIEWS_PER_PAGE);

  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  const endIndex = startIndex + REVIEWS_PER_PAGE;

  const currentReviews = reviewsList.slice(startIndex, endIndex);

  const renderTabContent = () => {
    if (activeTab === "curriculum") {
      return (
        <section className="favorite-flow-card favorite-flow-curriculum">
          <div className="favorite-flow-section-title">
            <h3>{t("profile.favoriteDetail.courseContent")}</h3>
            <span>{t("profile.favoriteDetail.lessonsDuration", { lessons: detail.lessonCount || 0, duration: `${Math.floor((detail.totalDurationSeconds || 0)/3600)}h ${Math.floor(((detail.totalDurationSeconds || 0)%3600)/60)}m` })}</span>
          </div>

          {(detail.sections || []).map((chapter, index) => {
            const isOpen = expandedChapters[chapter.sectionId] !== false;
            return (
            <article className="favorite-flow-chapter" key={chapter.sectionId || index}>
              <div className="favorite-flow-chapter-head" onClick={() => toggleChapter(chapter.sectionId)} style={{cursor: 'pointer'}}>
                <div>
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <strong>
                    {index + 1}. {chapter.title}
                  </strong>
                </div>
                <span>{t("profile.favoriteDetail.lessonsCount", { count: (chapter.lessons || []).length })}</span>
              </div>

              {isOpen && (
                <div className="favorite-flow-lessons">
                  {(chapter.lessons || []).map((lesson, lIndex) => (
                    <div className="favorite-flow-lesson" key={lesson.lessonId || lIndex}>
                      <span>{lIndex + 1}</span>
                      <p>{lesson.title}</p>
                      <small>
                        {t("profile.favoriteDetail.videoDuration", { duration: `${Math.floor((lesson.durationSeconds || 0)/60)}m ${(lesson.durationSeconds || 0)%60}s` })}
                      </small>
                      {isEnrolled ? (
                        <HelpCircle size={15} />
                      ) : (
                        <HelpCircle size={15} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          )})}
        </section>
      );
    }

    if (activeTab === "instructor") {
      return (
        <section className="favorite-flow-card favorite-flow-instructor">
          <img
              src={
                detail.instructor?.avatar &&
                detail.instructor.avatar.trim() !== ""
                    ? detail.instructor.avatar
                    : defaultAvatar
              }
              alt={detail.instructor?.fullName}
          />
          <div>
            <h3>{detail.instructor?.fullName}</h3>
            <strong>{t("profile.favoriteDetail.instructor")}</strong>
            <p>{detail.instructor?.description}</p>
          </div>
        </section>
      );
    }

    if (activeTab === "reviews") {
      return (
        <section className="favorite-flow-card favorite-flow-reviews">
          <div className="favorite-flow-review-score">
            <strong>{course.rating || '5.0'}</strong>
            <div>
              {[1, 2, 3, 4, 5].map((item) => (
                <Star key={item} size={16} fill="currentColor" />
              ))}
              <p>{t("profile.favoriteDetail.studentsRated", { count: reviewsList.length || course.reviews || 0 })}</p>
            </div>
          </div>
          {currentReviews.map((review, i) => (
            <article key={review.id || i} className="relative">
              <div>
                <strong>{review.studentName || 'Student'}</strong>
                <span>{review.rating}/5</span>
              </div>
              <p>{review.comment}</p>
            </article>
          ))}
          {reviewsList.length === 0 && <p className="text-gray-500 mt-4">{t("profile.favoriteDetail.noReviews")}</p>}
          {totalPages > 1 && (
              <div className="review-pagination">

                <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                >
                  {t("profile.favoriteDetail.previous")}
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
                  {t("profile.favoriteDetail.next")}
                </button>

              </div>
          )}
        </section>
      );
    }

    return (
      <>
        <section className="favorite-flow-card favorite-flow-outcomes">
          <h3>{t("profile.favoriteDetail.whatYouWillLearn")}</h3>
          <div>
            {(detail.whatYouLearn || []).map((item, i) => (
              <p key={i}>
                <Check size={15} />
                {item}
              </p>
            ))}
          </div>
        </section>

        {detail.requirements && detail.requirements.length > 0 && (
            <section className="favorite-flow-card favorite-flow-outcomes">
              <h3>{t("profile.favoriteDetail.requirements")}</h3>
              <div>
                {detail.requirements.map((item, i) => (
                  <p key={i}>
                    <Check size={15} />
                    {item}
                  </p>
                ))}
              </div>
            </section>
        )}

        <section className="favorite-flow-card favorite-flow-about">
          <h3>{t("profile.favoriteDetail.courseDescription")}</h3>
          <div dangerouslySetInnerHTML={{ __html: detail.description }} />
        </section>

        <section className="favorite-flow-card favorite-flow-curriculum">
          <div className="favorite-flow-section-title">
            <h3>{t("profile.favoriteDetail.courseContent")}</h3>
            <span>{t("profile.favoriteDetail.lessonsDuration", { lessons: detail.lessonCount || 0, duration: `${Math.floor((detail.totalDurationSeconds || 0)/3600)}h ${Math.floor(((detail.totalDurationSeconds || 0)%3600)/60)}m` })}</span>
          </div>

          {(detail.sections || []).map((chapter, index) => {
            const isOpen = expandedChapters[chapter.sectionId] !== false;
            return (
            <article className="favorite-flow-chapter" key={chapter.sectionId || index}>
              <div className="favorite-flow-chapter-head" onClick={() => toggleChapter(chapter.sectionId)} style={{cursor: 'pointer'}}>
                <div>
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <strong>
                    {index + 1}. {chapter.title}
                  </strong>
                </div>
                <span>{t("profile.favoriteDetail.lessonsCount", { count: (chapter.lessons || []).length })}</span>
              </div>

              {isOpen && (
                <div className="favorite-flow-lessons">
                  {(chapter.lessons || []).map((lesson, lIndex) => (
                    <div className="favorite-flow-lesson" key={lesson.lessonId || lIndex}>
                      <span>{lIndex + 1}</span>
                      <p>{lesson.title}</p>
                      <small>
                        {t("profile.favoriteDetail.videoDuration", { duration: `${Math.floor((lesson.durationSeconds || 0)/60)}m ${(lesson.durationSeconds || 0)%60}s` })}
                      </small>
                      {isEnrolled ? (
                        <CheckCircle2 size={15} className="text-green-500" />
                      ) : (
                        <CheckCircle2 size={15} className="text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          )})}
        </section>
      </>
    );
  };

  return (
    <div className="favorite-flow-page">
      {onBack && (


          <button
              type="button"
              className="learning-back-button"
              style={{ marginLeft: "-1300px" }}
              onClick={onBack}
          >
            <ArrowLeft size={16} />
            {t("profile.favoriteDetail.back")}
          </button>
      )}
      <section className="favorite-flow-hero">
        <div className="favorite-flow-preview">
          <img src={detail.thumbnailKey || course.image} alt={detail.title} />
          <button type="button" aria-label={t("profile.favoriteDetail.previewAria")}>
            <Play size={30} fill="currentColor" />
          </button>
          <span>
            <Play size={14} />
            {t("profile.favoriteDetail.previewCourse")}
          </span>
        </div>

        <div className="favorite-flow-summary">
          <span className="favorite-flow-category">{detail.categoryName}</span>
          <h2>{detail.title}</h2>
          <div className="favorite-flow-meta">
            <span>
              <User size={14} />
              {detail.instructor?.fullName}
            </span>
            <span>
              <Star size={14} fill="currentColor" />
              {course.rating || '0.0'} {t("profile.favoriteDetail.reviewsCount", { count: reviewsList.length || course.reviews || 0 })}
            </span>
            {isEnrolled ? (
              <>
                <span>{course.lessonsDone || 0} / {detail.lessonCount || 0} lessons</span>
                <span>{course.remaining || t("profile.favoriteDetail.continueLearning")}</span>
              </>
            ) : (
              <>
                <span>{t("profile.favoriteDetail.lessonsCount", { count: detail.lessonCount || 0 })}</span>
                <span>{Math.floor((detail.totalDurationSeconds || 0)/3600)}h {Math.floor(((detail.totalDurationSeconds || 0)%3600)/60)}m</span>
              </>
            )}
          </div>
          <p className="line-clamp-2" dangerouslySetInnerHTML={{ __html: detail.description }}></p>

          <div className="favorite-flow-buy-row">
            {isEnrolled ? (
              <article>
                <mark>{t("profile.favoriteDetail.purchased")}</mark>
                <strong>$0</strong>
                <div>
                  <button
                      className="favorite-flow-primary"
                      type="button"
                      onClick={handleContinueLearning}
                  >
                    <Play size={15} fill="currentColor" />
                    {t("profile.favoriteDetail.continueLearning")}
                  </button>
                  <button className="favorite-flow-secondary" type="button" onClick={handleRemoveFavorite}>
                    <Heart size={15} />
                    {t("profile.favoriteDetail.removeFromFavorites")}
                  </button>
                </div>
              </article>
            ) : (
              <article>
                <mark className="orange">{t("profile.favoriteDetail.notPurchased")}</mark>
                <strong className="orange-text">${detail.basePrice}</strong>
                {detail.originalPrice && <del>${detail.originalPrice}</del>}
                <div>
                  <button className="favorite-flow-cart" type="button">
                    <ShoppingCart size={15} />
                    {t("profile.favoriteDetail.buyNow")}
                  </button>
                  <button className="favorite-flow-secondary" type="button" onClick={handleRemoveFavorite}>
                    <Heart size={15} />
                    {t("profile.favoriteDetail.removeFromFavorites")}
                  </button>
                </div>
                <small>
                  <Check size={13} />
                  {t("profile.favoriteDetail.learnAnywhere")}
                </small>
                <small>
                  <Check size={13} />
                  {t("profile.favoriteDetail.moneyBack")}
                </small>
              </article>
            )}
          </div>
        </div>
      </section>

      <nav className="favorite-flow-tabs">
        {FAVORITE_DETAIL_TABS.map((tab) => {
          const Icon = tabIcons[tab.id];
          const label = tab.id === "reviews"
              ? `${tab.label} (${reviewsList.length || course.reviews || 0})`
              : tab.label;

          return (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="favorite-flow-body">
        <main>{renderTabContent()}</main>

        <aside>
          <section className="favorite-flow-card favorite-flow-info">
            <h3>{t("profile.favoriteDetail.courseInformation")}</h3>
            {courseInfo.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label}>
                  <span>
                    <Icon size={15} />
                    {item.label}
                  </span>
                  <strong className={item.badge ? "badge" : ""}>
                    {item.value}
                  </strong>
                </div>
              );
            })}
          </section>

          <section className="favorite-flow-card favorite-flow-share">
            <h3>{t("profile.favoriteDetail.shareCourse")}</h3>
            <p>{t("profile.favoriteDetail.shareSubtitle")}</p>
            <div>
              <button type="button" aria-label={t("profile.favoriteDetail.copyLinkAria")} onClick={handleCopyLink}>
                <LinkIcon size={16} />
              </button>
              <button type="button" aria-label={t("profile.favoriteDetail.shareFacebookAria")}>
                <FaFacebookF size={16} />
              </button>
              <button type="button" aria-label={t("profile.favoriteDetail.shareTwitterAria")}>
                <FaTwitter size={16} />
              </button>
              <button type="button" aria-label={t("profile.favoriteDetail.shareLinkedInAria")}>
                <FaLinkedinIn size={16} />
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default FavoriteCourseDetailSection;
