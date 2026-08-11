import { Circle, Eye, EyeOff, Info, Pencil, Star, Trash2 } from "lucide-react";
import { STATUS_LABELS } from "../../utils/CourseConfig";

const formatDuration = (totalSeconds) => {
  if (!totalSeconds) return "0:00";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const STATUS_MODIFIERS = {
  DRAFT: "draft",
  PENDING_REVIEW: "pending",
  PUBLISHED: "published",
  REJECTED: "rejected",
  HIDDEN: "inactive",
};

const CourseCard = ({ course, onDelete, onUpdate, onToggleVisibility, onViewDetail }) => {
  const isVisible = !course.isHidden;
  const isPublished = course.courseStatus === "PUBLISHED";
  const isRejected = course.courseStatus === "REJECTED";
  const studentCount = isPublished ? (course.studentCount ?? 0) : "-";
  const price = isPublished ? course.displayPrice : "-";
  const rating = isPublished ? course.rating : "-";
  const displayStatus = course.isHidden ? "HIDDEN" : course.courseStatus;
  const statusModifier = STATUS_MODIFIERS[displayStatus] ?? "draft";
  const statusLabel = STATUS_LABELS[displayStatus] ?? displayStatus;

  return (
    <article className="teacher-course-row">
      <div className="teacher-course-row__course">
        <div className="teacher-course-row__media">
          <img src={course.image} alt={course.title} />
          <span>{formatDuration(course.totalDurationSeconds)}</span>
        </div>
        <div>
          <h2>{course.title}</h2>
          <p>
            {course.category}
            <span aria-hidden="true">•</span>
            {course.modules} Lessons
          </p>
        </div>
      </div>

      <span
        className={`teacher-course-row__status teacher-course-row__status--${statusModifier}`}
        title={isRejected ? course.rejectionReason || undefined : undefined}
      >
        <Circle size={7} fill="currentColor" />
        {statusLabel}
      </span>

      <strong>{studentCount}</strong>
      <strong>{price}</strong>

      <strong className="teacher-course-row__rating">
        {isPublished ? (
          <>
            {rating}
            <Star size={14} fill="currentColor" />
          </>
        ) : (
          rating
        )}
      </strong>

      <span className="teacher-course-row__updated">{course.updatedAgo}</span>

      <div className="teacher-course-row__actions">
        <button type="button" aria-label={`Update ${course.title}`} onClick={() => onUpdate(course)}>
          <Pencil size={16} />
        </button>
        <button
          type="button"
          aria-label={isVisible ? `Hide ${course.title} from students` : `Show ${course.title} to students`}
          className={isVisible ? "teacher-course-row__btn--deactivate" : "teacher-course-row__btn--activate"}
          onClick={() => onToggleVisibility(course)}
        >
          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button type="button" aria-label={`View details of ${course.title}`} onClick={() => onViewDetail(course)}>
          <Info size={16} />
        </button>
        <button
          type="button"
          aria-label={`Delete ${course.title}`}
          className="teacher-course-row__btn--delete"
          onClick={() => onDelete(course)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
};

export default CourseCard;
