import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PlayCircle, X,Hand } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useAxiosPrivate } from "../../hooks/useAxiosPrivate";
import { getContinueLearningApi } from "../../../features/course/infrastructure/api/EnrollmentApi";
import { getFileUrl } from "../../api/public/CoursesApi";

import "./ContinueLearning.css";

const DISMISS_KEY = "learnova_continue_learning_dismissed";

const ContinueLearning = () => {
    const { t } = useTranslation();
    const { isAuthenticated, loading: authLoading, accessToken, currentUser } = useAuth();
    const axiosPrivate = useAxiosPrivate();

    const [course, setCourse] = useState(null);
    const [thumbnailUrl, setThumbnailUrl] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const navigate = useNavigate();

    // A real logout should reset the "maybe later" dismissal so the next
    // person to log in in this tab sees the welcome-back prompt again.
    useEffect(() => {
        const handleLogout = () => sessionStorage.removeItem(DISMISS_KEY);
        window.addEventListener("learnova:logout", handleLogout);
        return () => window.removeEventListener("learnova:logout", handleLogout);
    }, []);

    useEffect(() => {
        if (authLoading || !isAuthenticated) return;

        if (sessionStorage.getItem(DISMISS_KEY) === "true") return;

        let mounted = true;

        getContinueLearningApi(axiosPrivate, accessToken)
            .then((data) => {
                if (mounted && data) {
                    setCourse(data);
                    setIsVisible(true);
                }
            })
            .catch((err) => {
                console.error("Failed to load continue-learning course", err);
            });

        return () => {
            mounted = false;
        };
    }, [authLoading, isAuthenticated, axiosPrivate, accessToken]);

    useEffect(() => {
        if (!course?.thumbnailKey) {
            setThumbnailUrl(null);
            return;
        }

        getFileUrl(course.thumbnailKey)
            .then(setThumbnailUrl)
            .catch(() => setThumbnailUrl(null));
    }, [course]);

    const dismiss = () => {
        setIsClosing(true);
        sessionStorage.setItem(DISMISS_KEY, "true");
        setTimeout(() => setIsVisible(false), 200);
    };

    const handleContinue = () => {
        sessionStorage.setItem(DISMISS_KEY, "true");
        navigate(`/learnova/user/courses-detail/${course.courseId}`);
    };

    if (!isVisible || !course) {
        return null;
    }

    const firstName = currentUser?.fullName?.split(" ").slice(-1)[0];

    return (
        <div className={`welcome-back-overlay ${isClosing ? "welcome-back-overlay--closing" : ""}`}>
            <div className="welcome-back-modal">
                <button
                    type="button"
                    className="welcome-back-close"
                    onClick={dismiss}
                    aria-label={t('home.continueLearning.closeAriaLabel')}
                >
                    <X size={18} />
                </button>

                <div className="welcome-back-glow" aria-hidden="true" />

                {/*<Hand className="welcome-back-icon" size={24} />*/}
                <h2 className="welcome-back-title">
                    {t('home.continueLearning.welcomeBack', { name: firstName ? `, ${firstName}` : "" })}
                </h2>
                <p className="welcome-back-subtitle">
                    {t('home.continueLearning.subtitle')}
                </p>

                <div className="welcome-back-card">
                    {thumbnailUrl && (
                        <img
                            src={thumbnailUrl}
                            alt={course.title}
                            className="welcome-back-thumb"
                        />
                    )}

                    <div className="welcome-back-card-body">
                        <h3 className="welcome-back-course-title">{course.title}</h3>

                        <div className="welcome-back-progress-track">
                            <div
                                className="welcome-back-progress-fill"
                                style={{ width: `${course.progressPercent}%` }}
                            />
                        </div>
                        <span className="welcome-back-progress-label">
                            {t('home.continueLearning.lessonsProgress', {
                                completed: course.completedLessons,
                                total: course.totalLessons,
                                percent: course.progressPercent,
                            })}
                        </span>
                    </div>
                </div>

                <div className="welcome-back-actions">
                    <button
                        type="button"
                        className="welcome-back-btn welcome-back-btn--ghost"
                        onClick={dismiss}
                    >
                        {t('home.continueLearning.maybeLater')}
                    </button>
                    <button
                        type="button"
                        className="welcome-back-btn welcome-back-btn--primary"
                        onClick={handleContinue}
                    >
                        <PlayCircle size={18} />
                        {t('home.continueLearning.continueBtn')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContinueLearning;
