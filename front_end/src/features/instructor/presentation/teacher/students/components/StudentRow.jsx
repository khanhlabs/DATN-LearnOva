import { Info } from "lucide-react";
import { STUDENT_STATUS_LABELS } from "../data/studentsPageData";

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=1d4ed8&color=fff&name=Student";

const formatDate = (isoString) => {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const StudentRow = ({ student, onViewDetail }) => {
  const courseCount = student.courses.length;
  const courseTitles = student.courses.map((c) => c.courseTitle);

  return (
  <article className="teacher-student-row">
    <div className="teacher-student-row__profile">
      <img src={student.avatar || DEFAULT_AVATAR} alt={student.fullName} />
      <div>
        <strong>{student.fullName}</strong>
        <span>{student.email}</span>
      </div>
    </div>

    <span className="teacher-student-row__phone">{student.phone || "-"}</span>

    <div className="teacher-student-row__courses">
      <span title={courseTitles.join(", ")}>
        {courseCount} khóa học
      </span>
    </div>

    <time className="teacher-student-row__date">
      {formatDate(student.enrolledAt)}
    </time>

    <div className="teacher-student-row__progress">
      <strong>{student.progressPercent}%</strong>
      <div aria-hidden="true">
        <span
          className={student.progressPercent === 100 ? "teacher-student-row__progress-bar--complete" : ""}
          style={{ width: `${student.progressPercent}%` }}
        />
      </div>
    </div>

    <span className={`teacher-student-row__status teacher-student-row__status--${student.status.toLowerCase()}`}>
      {STUDENT_STATUS_LABELS[student.status] || student.status}
    </span>

    <div className="teacher-student-row__actions">
      <button
        type="button"
        aria-label={`View details of ${student.fullName}`}
        onClick={() => onViewDetail(student)}
      >
        <Info size={16} />
      </button>
    </div>
  </article>
  );
};

export default StudentRow;
