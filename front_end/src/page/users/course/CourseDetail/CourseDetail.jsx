import "./css/CourseDetail.css";
import { FaClipboardCheck, FaPlay, FaPlayCircle, FaClock, FaCheckCircle, FaStar, FaFlag } from "react-icons/fa";
import { ChevronDown } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "../../../../component/footer/Footer.jsx";
import CourseVideoPlayer from "./components/VideoPlayer.jsx";
import OverviewTab from "./components/OverviewTab.jsx";
import SummaryTab from "./components/summayTab.jsx";
import QATab from "./components/QATab.jsx";
import ReviewsTab from "./components/Review.jsx";
import chatbot from "../../../home/chat_bot/chatBot.jsx";
import QuizPage from "./components/QuizPage.jsx";
import Header from "../../../../component/header/user_header/Header.jsx";
import ReviewModal from "./components/ReviewModal.jsx";
import ReportCourseModal from "./ReportCourseModal.jsx";
import { getCourseReviewsApi, deleteReviewApi, getRatingSummaryApi, createReviewApi } from "../../../../api/courses/ReviewApi.js";
import axiosClient from "../../../../api/client/AxiosClient.js";
import { getCourseDetail, getFileUrl } from "../../../../api/public/CoursesApi.js";
import { getPublicInstructorByIdApi } from "../../../../api/public/InstructorApi.js";
import { getCourseProgressApi, updateLessonProgressApi } from "../../../../api/courses/ProgressApi.js";
import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../../../context/AuthContext";
import { useParams } from "react-router-dom";

const formatDuration = (totalSeconds) => {
    if (!totalSeconds) return "0:00";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
};

function CourseDetail() {
    const { t } = useTranslation();
    const { courseId } = useParams();
    const reviewsPerPage = 3;
    const [reviewsLoaded, setReviewsLoaded] = useState(false);

    const [course, setCourse] = useState(null);
    const [instructorAvatarUrl, setInstructorAvatarUrl] = useState(null);
    const [instructorProfile, setInstructorProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [videoUrl, setVideoUrl] = useState(null);
    const [activeLesson, setActiveLesson] = useState(null);
    const [loadingVideo, setLoadingVideo] = useState(false);

    const [reviewsData, setReviewsData] = useState([]);
    const [ratingSummary, setRatingSummary] = useState(null);

    const [activeTab, setActiveTab] = useState("overview");
    const [expandedSections, setExpandedSections] = useState([]);
    const [expandedDescription, setExpandedDescription] = useState(false);

    const { currentUser } = useContext(AuthContext);
    const currentUserId = currentUser?.id || currentUser?.userId || currentUser?.idUser;

    const [courseProgress, setCourseProgress] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const hasAutoPromptedReview = useRef(false);

    const [reviewQuery, setReviewQuery] = useState("");
    const [ratingFilter, setRatingFilter] = useState("all");
    const [currentReviewPage, setCurrentReviewPage] = useState(1);
    const [helpfulMap, setHelpfulMap] = useState({});

    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [showQuestionForm, setShowQuestionForm] = useState(false);

    useEffect(() => {
        if (!courseId) return;
        const load = async () => {
            try {
                const data = await getCourseDetail(courseId);
                setCourse(data);

                if (data.sections?.length > 0) {
                    setExpandedSections([data.sections[0].sectionId]);
                }

                if (data.instructor?.avatarKey) {
                    setInstructorAvatarUrl(data.instructor.avatarKey);
                }

                if (data.instructor?.id) {
                    getPublicInstructorByIdApi(data.instructor.id)
                        .then(setInstructorProfile)
                        .catch(() => {});
                }

                const firstLesson = data.sections
                    ?.flatMap((s) => s.lessons)
                    ?.find((l) => l.videoKey);

                if (firstLesson) {
                    setActiveLesson(firstLesson);
                    setLoadingVideo(true);
                    getFileUrl(firstLesson.videoKey)
                        .then(setVideoUrl)
                        .catch(() => {})
                        .finally(() => setLoadingVideo(false));
                }
            } catch (err) {
                console.error("Failed to load course:", err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [courseId]);
    useEffect(() => {
        if (!courseId) return;

        getCourseReviewsApi(courseId)
            .then((data) => {
                setReviewsData(data);
            })
            .finally(() => {
                setReviewsLoaded(true);
            });
    }, [courseId]);
    useEffect(() => {
        if (!courseId) return;
        getCourseReviewsApi(courseId).then(setReviewsData).catch(console.error);
        getRatingSummaryApi(courseId).then(setRatingSummary).catch(console.error);
    }, [courseId]);

    const hasReviewed = reviewsData?.some((r) => {
        const ownerId = r.userId || r.idUser || r.id || (r.user && r.user.id);
        return currentUserId && ownerId && String(ownerId) === String(currentUserId);
    });

    const isCourseCompleted = !!(
        courseProgress?.isCourseCompleted ||
        courseProgress?.courseCompleted ||
        Math.round(courseProgress?.courseProgressPercent || 0) === 100
    );

    const isCourseInstructor = !!(
        currentUserId &&
        course?.instructor?.id &&
        String(course.instructor.id) === String(currentUserId)
    );

    const handleSubmitReport = async ({ reason, description }) => {
        if (!courseId) return;
        setIsSubmittingReport(true);
        try {
            await axiosClient.post("/reports", {
                courseId: Number(courseId),
                reason,
                description: description?.trim() ? description.trim() : "",
                lessonId: activeLesson?.lessonId || null,
            });
            toast.success("Report submitted. Admins will review it.");
            setShowReportModal(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to submit report.");
        } finally {
            setIsSubmittingReport(false);
        }
    };

    useEffect(() => {
        if (!courseId || !currentUserId || !reviewsLoaded) return;

        getCourseProgressApi(courseId)
            .then((data) => {
                setCourseProgress(data);

                const isCompleted =
                    data?.isCourseCompleted ||
                    data?.courseCompleted ||
                    Math.round(data?.courseProgressPercent || 0) === 100;

                if (
                    isCompleted &&
                    !hasReviewed &&
                    !hasAutoPromptedReview.current
                ) {
                    hasAutoPromptedReview.current = true;
                    setShowReviewModal(true);
                }
            });
    }, [
        courseId,
        currentUserId,
        reviewsLoaded,
        hasReviewed
    ]);

    const handleVideoProgressUpdate = useCallback(async (currentTime) => {
        if (!activeLesson || !currentUserId) return;
        try {
            const res = await updateLessonProgressApi(activeLesson.lessonId, currentTime);
            setCourseProgress(res);
            const isCompleted = res?.isCourseCompleted || res?.courseCompleted || Math.round(res?.courseProgressPercent || 0) === 100;
            if (isCompleted && !hasReviewed && !hasAutoPromptedReview.current) {
                hasAutoPromptedReview.current = true;
                setShowReviewModal(true);
            }
        } catch (err) {
            // Silence progress update errors for non-enrolled users
        }
    }, [activeLesson, currentUserId, reviewsData, hasReviewed]);

    const handleReviewSubmit = async ({ rating, comment }) => {
        setIsSubmittingReview(true);
        try {
            await createReviewApi({ courseId: Number(courseId), rating, comment });
            toast.success(t("courseDetail.reviewThankYou"));
            setShowReviewModal(false);
            const updatedReviews = await getCourseReviewsApi(courseId);
            setReviewsData(updatedReviews);
            const updatedSummary = await getRatingSummaryApi(courseId);
            setRatingSummary(updatedSummary);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || t("courseDetail.reviewSubmitError"));
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleLessonClick = useCallback(async (lesson) => {
        if (!lesson.videoKey || lesson.lessonId === activeLesson?.lessonId) return;
        setActiveLesson(lesson);
        setLoadingVideo(true);
        setVideoUrl(null);
        try {
            const url = await getFileUrl(lesson.videoKey);
            setVideoUrl(url);
        } catch (err) {
            console.error("Failed to load video:", err);
        } finally {
            setLoadingVideo(false);
        }
    }, [activeLesson]);

    const handleDeleteReview = async (reviewId) => {
        try {
            await deleteReviewApi(reviewId);
            setReviewsData((prev) => prev.filter((item) => item.reviewId !== reviewId));
            return true;
        } catch (error) {
            console.log(error);
            throw error;
        }
    };

    const toggleSection = (sectionId) => {
        setExpandedSections((prev) =>
            prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
        );
    };

    const handleSearchReviews = (e) => { setReviewQuery(e.target.value); setCurrentReviewPage(1); };
    const handleRatingFilter = (e) => { setRatingFilter(e.target.value); setCurrentReviewPage(1); };
    const toggleHelpful = (id) => setHelpfulMap((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    const handleReplySubmit = (qId) => { if (!replyText.trim()) return; setReplyText(""); };

    if (isLoading) {
        return (
            <div className="course-detail-container">
                <Header />
                <div style={{ textAlign: "center", padding: "80px", color: "#94a3b8", fontSize: "15px" }}>
                    {t("courseDetail.loading")}
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="course-detail-container">
                <Header />
                <div style={{ textAlign: "center", padding: "80px", color: "#94a3b8", fontSize: "15px" }}>
                    {t("courseDetail.notFound")}
                </div>
            </div>
        );
    }

    return (
        <div className="course-detail-container">
            <Header />

            <div className="main-layout">
                {/* LEFT SIDE */}
                <div className="left-side">
                    <CourseVideoPlayer
                        src={videoUrl}
                        loading={loadingVideo}
                        initialTime={(() => {
                            const lp = courseProgress?.lessonProgresses?.find(
                                (p) => p.lessonId === activeLesson?.lessonId
                            );
                            // Already-completed lessons resume from the start instead of
                            // seeking to the end, where they'd look stuck/paused.
                            if (!lp || lp.isCompleted) return 0;
                            return lp.watchedSeconds || 0;
                        })()}
                        onProgressUpdate={handleVideoProgressUpdate}
                    />
                    <ToastContainer />

                    <div className="tabs-container">
                        <div className="tabs-wrapper">
                            <button className={`tab-btn ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>{t("courseDetail.tabOverview")}</button>
                            <button className={`tab-btn ${activeTab === "qa" ? "active" : ""}`} onClick={() => setActiveTab("qa")}>{t("courseDetail.tabQA")}</button>
                            <button className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`} onClick={() => setActiveTab("reviews")}>{t("courseDetail.tabReviews")}</button>
                            <button className={`tab-btn ${activeTab === "quiz" ? "active" : ""}`} onClick={() => setActiveTab("quiz")}>{t("courseDetail.tabQuiz")}</button>
                            <button className={`tab-btn ${activeTab === "summary" ? "active" : ""}`} onClick={() => setActiveTab("summary")}>{t("courseDetail.tabSummary")}</button>
                        </div>
                        {!isCourseInstructor && (
                            <button
                                type="button"
                                className="course-report-btn"
                                onClick={() => setShowReportModal(true)}
                                aria-label="Report this course"
                            >
                                <FaFlag size={13} />
                                Report
                            </button>
                        )}
                    </div>

                    <div className="content-section">
                        {activeTab === "overview" && (
                            <OverviewTab
                                course={course}
                                instructor={course.instructor}
                                instructorAvatarUrl={instructorAvatarUrl}
                                instructorProfile={instructorProfile}
                                expandedDescription={expandedDescription}
                                setExpandedDescription={setExpandedDescription}
                            />
                        )}

                        {activeTab === "qa" && (
                            <QATab
                                lessonId={activeLesson?.lessonId}
                                course={course}
                                selectedQuestion={selectedQuestion}
                                setSelectedQuestion={setSelectedQuestion}
                                showQuestionForm={showQuestionForm}
                                setShowQuestionForm={setShowQuestionForm}
                                showReplyForm={showReplyForm}
                                setShowReplyForm={setShowReplyForm}
                                replyText={replyText}
                                setReplyText={setReplyText}
                                handleReplySubmit={handleReplySubmit}
                            />
                        )}

                        {activeTab === "reviews" && (
                            <ReviewsTab
                                reviewsData={reviewsData}
                                setReviewsData={setReviewsData}
                                currentUserId={currentUserId}
                                ratingSummary={ratingSummary}
                                handleDeleteReview={handleDeleteReview}
                                reviewQuery={reviewQuery}
                                setReviewQuery={setReviewQuery}
                                ratingFilter={ratingFilter}
                                setRatingFilter={setRatingFilter}
                                currentReviewPage={currentReviewPage}
                                setCurrentReviewPage={setCurrentReviewPage}
                                reviewsPerPage={reviewsPerPage}
                                helpfulMap={helpfulMap}
                                toggleHelpful={toggleHelpful}
                                handleSearchReviews={handleSearchReviews}
                                handleRatingFilter={handleRatingFilter}
                                isCourseCompleted={isCourseCompleted}
                                hasReviewed={hasReviewed}
                                openReviewModal={() => setShowReviewModal(true)}
                            />
                        )}
                    </div>

                    {activeTab === "quiz" && <QuizPage lessonId={activeLesson?.lessonId} />}
                    {activeTab === "summary" && <SummaryTab lessonId={activeLesson?.lessonId} />}

                    <div className="footer-wrapper">
                        <Footer />
                    </div>
                </div>

                {/* RIGHT SIDE - Curriculum */}
                <aside className="right-side">
                    <div className="curriculum-sidebar">
                        {courseProgress && (
                            <div className="curriculum-progress-box">
                                <div className="curriculum-progress-header">
                                    <span className="curriculum-progress-title">{t("courseDetail.courseProgress")}</span>
                                    <span className="curriculum-progress-text">
                                        {t("courseDetail.lessonsProgress", {
                                            completed: courseProgress.completedLessonsCount,
                                            total: courseProgress.totalLessonsCount,
                                            percent: Math.round(courseProgress.courseProgressPercent),
                                        })}
                                    </span>
                                </div>
                                <div className="curriculum-progress-bar-track">
                                    <div
                                        className="curriculum-progress-bar-fill"
                                        style={{ width: `${courseProgress.courseProgressPercent}%` }}
                                    />
                                </div>
                                {isCourseCompleted && !hasReviewed && (
                                    <button
                                        className="btn-review-trigger"
                                        onClick={() => setShowReviewModal(true)}
                                    >
                                        <FaStar /> {t("courseDetail.courseReviewBtn")}
                                    </button>
                                )}
                                {isCourseCompleted && hasReviewed && (
                                    <div className="reviewed-badge">
                                        ✓ {t("courseDetail.alreadyRated")}
                                    </div>
                                )}
                            </div>
                        )}

                        {course.sections.map((section, sIdx) => (
                            <div key={section.sectionId} className="curriculum-section">
                                <div className="section-header-qa" onClick={() => toggleSection(section.sectionId)}>
                                    <ChevronDown
                                        size={18}
                                        className={`chevron ${expandedSections.includes(section.sectionId) ? "open" : ""}`}
                                    />
                                    <div className="section-title-co">
                                        <strong>{sIdx + 1}. {section.title}</strong>
                                        <div className="section-meta">
                                            <span>
                                                <FaPlayCircle />
                                                {t("courseDetail.lessonsCount", { count: section.lessons.length })}
                                            </span>
                                            <span>
                                                <FaClock />
                                                {formatDuration(
                                                    section.lessons.reduce((sum, l) => sum + (l.durationSeconds || 0), 0)
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {expandedSections.includes(section.sectionId) && (
                                    <div className="lessons-sidebar">
                                        {section.lessons.map((lesson) => {
                                            const lp = courseProgress?.lessonProgresses?.find(
                                                (p) => p.lessonId === lesson.lessonId
                                            );
                                            const isCompleted = lp?.isCompleted;

                                            return (
                                                <div
                                                    key={lesson.lessonId}
                                                    className={`lesson-item ${activeLesson?.lessonId === lesson.lessonId ? "active" : ""}`}
                                                    onClick={() => handleLessonClick(lesson)}
                                                    style={{ cursor: lesson.videoKey ? "pointer" : "default" }}
                                                >
                                                    <div className="lesson-info">
                                                        {isCompleted ? (
                                                            <FaCheckCircle className="lesson-icon completed" />
                                                        ) : (
                                                            <FaPlay className="lesson-icon" />
                                                        )}
                                                        <span className="lesson-name">{lesson.title}</span>
                                                    </div>
                                                    <span className="lesson-time">
                                                        {formatDuration(lesson.durationSeconds)}
                                                    </span>
                                                </div>
                                            );
                                        })}

                                        <div
                                            className="quiz-item"
                                            onClick={() => {
                                                setActiveTab("quiz");
                                                setTimeout(() => {
                                                    document.querySelector(".tabs-container")?.scrollIntoView({ behavior: "smooth", block: "start" });
                                                }, 100);
                                            }}
                                        >
                                            <div className="quiz-icon-wrapper">
                                                <FaClipboardCheck className="quiz-icon" />
                                            </div>
                                            <div className="quiz-content">
                                                <span className="quiz-title">{t("courseDetail.quizTitle")}</span>
                                                <span className="quiz-subtitle-co">{t("courseDetail.quizSubtitle")}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>
            </div>

            <ReviewModal
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                onSubmit={handleReviewSubmit}
                isSubmitting={isSubmittingReview}
            />

            <ReportCourseModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                onSubmit={handleSubmitReport}
                isSubmitting={isSubmittingReport}
            />

            <div className="chatbot-fixed">
                <chatbot />
            </div>
        </div>
    );
}

export default CourseDetail;
