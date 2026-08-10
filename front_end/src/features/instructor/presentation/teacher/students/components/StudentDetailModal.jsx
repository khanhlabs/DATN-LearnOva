import { X, Mail, Phone, Calendar, BookOpen, TrendingUp, Award } from "lucide-react";
import { STUDENT_STATUS_LABELS } from "../data/studentsPageData";

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=1d4ed8&color=fff&name=Student&size=128";

const formatDate = (isoString) => {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const StudentDetailModal = ({ student, onClose }) => {
  if (!student) return null;

  const progress = student.progressPercent ?? 0;
  const isComplete = student.status === "COMPLETED";

  return (
    <div className="sdm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sdm" role="dialog" aria-modal="true" aria-label={`Student detail: ${student.fullName}`}>

        {/* Header */}
        <div className="sdm__header">
          <button className="sdm__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
          <img
            src={student.avatar || DEFAULT_AVATAR.replace("Student", encodeURIComponent(student.fullName || "Student"))}
            alt={student.fullName}
            className="sdm__avatar"
          />
          <h2 className="sdm__name">{student.fullName}</h2>
          <span className={`sdm__badge ${isComplete ? "sdm__badge--complete" : "sdm__badge--active"}`}>
            {STUDENT_STATUS_LABELS[student.status] || student.status}
          </span>
        </div>

        {/* Body */}
        <div className="sdm__body">

          {/* Info cards */}
          <div className="sdm__info-grid">
            <div className="sdm__info-card">
              <Mail size={16} className="sdm__info-icon sdm__info-icon--blue" />
              <div>
                <span className="sdm__info-label">Email</span>
                <span className="sdm__info-value">{student.email || "-"}</span>
              </div>
            </div>
            <div className="sdm__info-card">
              <Phone size={16} className="sdm__info-icon sdm__info-icon--green" />
              <div>
                <span className="sdm__info-label">Điện thoại</span>
                <span className="sdm__info-value">{student.phone || "-"}</span>
              </div>
            </div>
            <div className="sdm__info-card">
              <Calendar size={16} className="sdm__info-icon sdm__info-icon--purple" />
              <div>
                <span className="sdm__info-label">Ngày tham gia</span>
                <span className="sdm__info-value">{formatDate(student.enrolledAt)}</span>
              </div>
            </div>
            <div className="sdm__info-card">
              <TrendingUp size={16} className="sdm__info-icon sdm__info-icon--orange" />
              <div>
                <span className="sdm__info-label">Tiến độ TB</span>
                <span className="sdm__info-value">{progress}%</span>
              </div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="sdm__section">
            <h3 className="sdm__section-title">
              <Award size={15} />
              Tiến độ tổng thể
            </h3>
            <div className="sdm__progress-wrap">
              <div className="sdm__progress-track">
                <div
                  className={`sdm__progress-fill ${isComplete ? "sdm__progress-fill--complete" : ""}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="sdm__progress-label">{progress}%</span>
            </div>
          </div>

          {/* Courses breakdown */}
          {student.courses?.length > 0 && (
            <div className="sdm__section">
              <h3 className="sdm__section-title">
                <BookOpen size={15} />
                Khóa học đã đăng ký
              </h3>
              <ul className="sdm__course-list">
                {student.courses.map((course, idx) => (
                  <li key={course.courseId} className="sdm__course-item">
                    <span className="sdm__course-num">{idx + 1}</span>
                    <div className="sdm__course-info">
                      <span className="sdm__course-name">{course.courseTitle}</span>
                      <span className="sdm__course-meta">
                        Tham gia {formatDate(course.enrolledAt)}
                      </span>
                    </div>
                    <div className="sdm__course-progress">
                      <div className="sdm__course-progress-track">
                        <div
                          className={`sdm__course-progress-fill ${course.progressPercent === 100 ? "sdm__course-progress-fill--complete" : ""}`}
                          style={{ width: `${course.progressPercent}%` }}
                        />
                      </div>
                      <span>{course.progressPercent}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sdm__footer">
          <button className="sdm__btn-cancel" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailModal;
