import {
  ArrowLeft,
  CheckCircle,
  Play,
  Star,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import defaultAvatar from "../../../../../../../assets/default_avatar.jpg";

const CourseDetailHero = ({ course, onBack, onContinue }) => {
  const { t } = useTranslation();

  return (
      <header className="learning-detail-hero">
        <div className="learning-detail-actions">
          <button
              className="learning-back-button"
              type="button"
              onClick={onBack}
          >
            <ArrowLeft size={16} />
            {t("profile.learningDetail.back")}
          </button>
        </div>

        <div className="learning-hero-grid">
          <div className="learning-video-cover">
            {course.image && (
              <img src={course.image} alt={course.title} />
            )}

            <span>{course.category}</span>

            <button
              type="button"
              onClick={onContinue}
              aria-label={t("profile.learningDetail.watchLesson")}
            >
              <Play size={32} fill="currentColor" />
            </button>
          </div>

          <div className="learning-hero-copy">
            <h1>{course.title}</h1>

            <div className="learning-meta-line">
            <span>
              <Star size={18} fill="currentColor" />
              <strong>{course.rating}</strong>
            </span>

              <span>{t("profile.learningDetail.reviewsCount", { count: course.reviews })}</span>

              <span className="learning-dot" />

              <span>
              <Users size={17} />
                {t("profile.learningDetail.studentsCount", { count: course.students })}
            </span>
            </div>

            <div className="learning-instructor-line">
              <img
                  src={course.instructor?.avatar || defaultAvatar}
                  alt={course.instructor?.name || t("profile.learningDetail.instructorFallback")}
              />
              <span>{t("profile.learningDetail.instructorLabel")}</span>
              <strong>{course.instructor.name}</strong>
              <CheckCircle size={17} fill="currentColor" />
            </div>

            <p>{course.summary}</p>

            <div className="learning-tag-list">
              {course.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </header>
  );
};

export default CourseDetailHero;
