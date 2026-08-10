import {
  BookOpen,
  Calendar,
  Clock,
  Download,
  HelpCircle,
  RotateCcw,
  Play,
  User,
  Users,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const CourseDetailSidebar = ({ course, certificate, onDownloadCertificate }) => {
  const { t } = useTranslation();
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (course.progress / 100) * circumference;

  const infoRows = [
    { icon: User, label: t("profile.learningDetail.instructor"), value: course.instructor.name },
    { icon: Clock, label: t("profile.learningDetail.duration"), value: course.duration },
    { icon: Users, label: t("profile.learningDetail.students"), value: course.students },
    { icon: BookOpen, label: t("profile.learningDetail.lessons"), value: course.lessonsTotal },
    { icon: Calendar, label: t("profile.learningDetail.lastUpdated"), value: course.updatedAt },
    { icon: BarChart3, label: t("profile.learningDetail.level"), value: course.level },
  ];
  const navigate = useNavigate();

  return (
    <aside className="learning-detail-sidebar">
      <section className="learning-side-card">
        <h3>{t("profile.learningDetail.learningProgress")}</h3>

        <div className="learning-progress-ring">
          <svg viewBox="0 0 132 132" aria-hidden="true">
            <circle cx="66" cy="66" r={radius} />
            <circle
              cx="66"
              cy="66"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>

          <div>
            <strong>{course.progress}%</strong>
            <span>{t("profile.learningDetail.completed")}</span>
          </div>
        </div>

        <p>{t("profile.learningDetail.keepGoing")}</p>

        <strong className="learning-finished">
          {course.lessonsDone} / {course.lessonsTotal} lessons
        </strong>

        <div className="learning-linear-progress">
          <span style={{ width: `${course.progress}%` }} />
        </div>

        <small>{t("profile.learningDetail.keepGoingHint")}</small>

        {course.progress === 100 ? (
            <>
              <button className="learning-primary-button completed" type="button">
                <Play size={16} fill="white" />
                {t("profile.learningDetail.courseCompletedBtn")}
              </button>
              {certificate && (
                <button
                    className="learning-secondary-button"
                    type="button"
                    onClick={onDownloadCertificate}
                >
                  <Download size={16} />
                  {t("profile.learningDetail.downloadCertificate", {
                    defaultValue: "Download Certificate",
                  })}
                </button>
              )}
            </>
        ) : (
            <button
                className="learning-primary-button"
                type="button"
                onClick={() => navigate(`/learnova/user/courses-detail/${course.courseId}`)}
            >
              <Play size={16} fill="currentColor" />
              {t("profile.learningDetail.continueLearningBtn")}
            </button>
        )}

        <button className="learning-secondary-button" type="button">
          <RotateCcw size={16} />
          {t("profile.learningDetail.restartCourse")}
        </button>
      </section>

      <section className="learning-side-card">
        <h3>{t("profile.learningDetail.courseInformation")}</h3>

        <div className="learning-info-list">
          {infoRows.map((row) => {
            const Icon = row.icon;

            return (
              <div key={row.label}>
                <span>
                  <Icon size={17} />
                  {row.label}
                </span>
                <strong>{row.value}</strong>
              </div>
            );
          })}
        </div>
      </section>

      {/*<section className="learning-support-card">*/}
      {/*  <h3>Need Help?</h3>*/}

      {/*  <p>*/}
      {/*    Ask questions and get support from the instructor and learning*/}
      {/*    community.*/}
      {/*  </p>*/}

      {/*  <button type="button">*/}
      {/*    <HelpCircle size={18} />*/}
      {/*    Ask a Question*/}
      {/*  </button>*/}
      {/*</section>*/}
    </aside>
  );
};

export default CourseDetailSidebar;
