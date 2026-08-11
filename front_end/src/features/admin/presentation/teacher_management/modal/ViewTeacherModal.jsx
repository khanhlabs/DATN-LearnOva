import {
  BarChart3,
  BookOpen,
  CircleDollarSign,
  Mail,
  Phone,
  Star,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import defaultCover from "../../../../../assets/image/TeacherCoverImage.png";
import "./ViewTeacherModal.css";

const formatCurrency = (value) => {
  const amount = Number(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB").format(date);
};

const formatDateTime = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatNumber = (value) =>
  new Intl.NumberFormat("vi-VN").format(value == null ? 0 : Number(value) || 0);

const valueOrDash = (value) =>
  value === null || value === undefined || value === "" ? "--" : value;

const getInitials = (name) =>
  String(name || "Instructor")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "I";

const getVisibility = (isDeleted) => (isDeleted ? "Hidden" : "Available");

const prettifyStatus = (status) =>
  String(status || "N/A")
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getCourseStatusClass = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("published") || normalized.includes("active")) return "published";
  if (normalized.includes("pending") || normalized.includes("review")) return "pending";
  if (normalized.includes("draft")) return "draft";
  return "default";
};

const InfoRow = ({ label, children }) => (
  <div className="info-row">
    <span>{label}</span>
    <i>:</i>
    <strong>{children}</strong>
  </div>
);

const PanelCard = ({ icon: Icon, title, children, className = "" }) => (
  <div className={`modal-panel-card ${className}`.trim()}>
    <h4>
      <span>
        <Icon size={17} />
      </span>
      {title}
    </h4>
    {children}
  </div>
);

const ViewTeacherModal = ({ instructor, courses = [], isLoading, error, onClose }) => {
  const { t } = useTranslation();
  const [avatarError, setAvatarError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
    setCoverError(false);
  }, [instructor?.instructorId, instructor?.avatar, instructor?.coverImage]);

  if (!instructor) return null;

  const fullName = instructor.fullName || instructor.name || "Unknown instructor";
  const courseItems = Array.isArray(instructor.courses) ? instructor.courses : courses;
  const avatar = instructor.avatar;
  const coverImage = instructor.coverImage || defaultCover;
  const resolvedCover = coverError ? defaultCover : coverImage;

  return (
    <div className="instructor-view-overlay" onClick={onClose} role="presentation">
      <div
        className="instructor-view-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t("instructorAdmin.viewInstructor")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="view-header">
          <h2>{t("instructorAdmin.viewInstructor")}</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error ? <div className="instructor-view-error">{error}</div> : null}

        <div className="profile-section">
          <div className="cover-image">
            <img
              src={resolvedCover}
              alt=""
              onError={() => setCoverError(true)}
            />
          </div>

          <div className="profile-info">
            <div className="avatar-box">
              {!avatarError && avatar ? (
                <img
                  src={avatar}
                  alt={fullName}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span>{getInitials(fullName)}</span>
              )}
            </div>

            <div className="basic-profile">
              <h3>{fullName}</h3>
              <p>
                <Mail size={14} />
                {valueOrDash(instructor.email)}
              </p>
              <p>
                <Phone size={14} />
                {valueOrDash(instructor.phone)}
              </p>
              <p>
                <BookOpen size={14} />
                {valueOrDash(instructor.specialization || instructor.category)}
              </p>
            </div>

            <div className="profile-extra">
              <div className="info-card">
                <label>{t("instructorAdmin.instructorId")}</label>
                <span>{valueOrDash(instructor.instructorCode || instructor.id)}</span>
              </div>
              <div className="info-card">
                <label>{t("instructorAdmin.createdAt")}</label>
                <span>{formatDate(instructor.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="content-section">
          <PanelCard icon={UserRound} title={t("instructorAdmin.basicInformation")} className="modal-panel-card--info">
            <InfoRow label={t("instructorAdmin.fullName")}>{fullName}</InfoRow>
            <InfoRow label={t("instructorAdmin.email")}>{valueOrDash(instructor.email)}</InfoRow>
            <InfoRow label={t("instructorAdmin.phone")}>{valueOrDash(instructor.phone)}</InfoRow>
            <InfoRow label={t("instructorAdmin.specialization")}>{valueOrDash(instructor.specialization || instructor.category)}</InfoRow>
            <InfoRow label={t("instructorAdmin.gender")}>{valueOrDash(instructor.gender)}</InfoRow>
            <InfoRow label={t("instructorAdmin.visibility")}>{t(`instructorAdmin.${getVisibility(instructor.isDeleted).toLowerCase()}`)}</InfoRow>
            <InfoRow label={t("instructorAdmin.dateOfBirth")}>{formatDate(instructor.dateOfBirth)}</InfoRow>
            <InfoRow label={t("instructorAdmin.createdAt")}>{formatDateTime(instructor.createdAt)}</InfoRow>
            <InfoRow label={t("instructorAdmin.updatedAt")}>{formatDateTime(instructor.updatedAt)}</InfoRow>
          </PanelCard>

          <PanelCard icon={BarChart3} title={t("instructorAdmin.teachingStatistics")} className="modal-panel-card--stats">
            <div className="stat-grid">
              <div className="stat-box">
                <span className="stat-icon stat-icon-blue"><BookOpen size={26} /></span>
                <p>{t("instructorAdmin.managedCourses")}</p>
                <h2>{formatNumber(instructor.numberOfClasses ?? instructor.displayClasses)}</h2>
              </div>
              <div className="stat-box">
                <span className="stat-icon stat-icon-green"><Users size={26} /></span>
                <p>{t("instructorAdmin.totalStudents")}</p>
                <h2>{formatNumber(instructor.totalStudents)}</h2>
              </div>
              <div className="stat-box">
                <span className="stat-icon stat-icon-purple"><CircleDollarSign size={26} /></span>
                <p>{t("instructorAdmin.totalRevenue")}</p>
                <h2>{formatCurrency(instructor.totalRevenue)}</h2>
              </div>
            </div>
          </PanelCard>
        </div>

        <div className="course-section">
          <h4>
            <span><BookOpen size={17} /></span>
            {t("instructorAdmin.courses")} ({courseItems.length})
          </h4>

          <div className="course-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("instructorAdmin.course")}</th><th>{t("instructorAdmin.category")}</th><th>{t("instructorAdmin.students")}</th><th>{t("instructorAdmin.rating")}</th><th>{t("instructorAdmin.price")}</th><th>{t("instructorAdmin.status")}</th><th>{t("instructorAdmin.publishedAt")}</th>
                </tr>
              </thead>

              <tbody>
                {courseItems.length > 0 ? (
                  courseItems.map((course) => {
                    const status = prettifyStatus(course.status);

                    return (
                      <tr key={course.id || course.courseId || course.title}>
                        <td>
                          <div className="course-cell">
                            {course.thumbnailKey ? (
                              <img src={course.thumbnailUrl || course.thumbnailKey} alt={course.title || "Course"} />
                            ) : (
                              <span className="course-thumb-fallback">AI</span>
                            )}
                            <strong>{valueOrDash(course.title || course.courseName)}</strong>
                          </div>
                        </td>
                        <td>{valueOrDash(course.category || course.categoryName)}</td>
                        <td>{formatNumber(course.students ?? course.totalStudents)}</td>
                        <td>
                          <span className="rating-cell">
                            <Star size={14} fill="currentColor" />
                            {Number(course.rating || 0).toFixed(1)}
                          </span>
                        </td>
                        <td>{formatCurrency(course.price || course.basePrice)}</td>
                        <td>
                          <span className={`course-status ${getCourseStatusClass(course.status)}`}>
                            {status}
                          </span>
                        </td>
                        <td>{formatDate(course.publishedAt)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-course-row">
                      {isLoading ? t("instructorAdmin.loadingDetails") : t("instructorAdmin.noCourseData")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="view-footer">
          <button type="button" onClick={onClose}>{t("instructorAdmin.close")}</button>
        </div>
      </div>
    </div>
  );
};

export default ViewTeacherModal;
