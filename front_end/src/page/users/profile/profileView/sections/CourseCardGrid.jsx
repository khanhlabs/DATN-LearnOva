import { CheckCircle2, Heart, Play, Star } from "lucide-react";

const CourseCardGrid = ({
  courses = [],
  onOpenCourse,
  onRemoveFavorite,
  variant = "mine",
}) => {
  const isFavorite = variant === "favorite";

  return (
    <div className="profile-course-grid">
      {courses.map((course, index) => {
        const progress = Number(course.progress) || 0;
        const isCompleted = !isFavorite && progress >= 100;
        const rating = Number(course.rating);

        return (
          <article
            key={course.id ?? `${course.title}-${index}`}
            className="profile-course-card"
            onClick={() => onOpenCourse?.(course)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onOpenCourse?.(course);
              }
            }}
          >
            <div className="profile-course-card-media">
              <img src={course.image} alt={course.title} />

              {!isFavorite && (
                <span className="profile-course-progress-badge">
                  Progress: {progress}%
                </span>
              )}

              {isFavorite && (
                <button
                  className="profile-course-bookmark favorite"
                  type="button"
                  aria-label="Remove from favorites"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFavorite?.(course.id);
                  }}
                >
                  <Heart size={18} fill="currentColor" />
                </button>
              )}
            </div>

            <div className="profile-course-card-body">
              <h4>{course.title}</h4>

              <div className="profile-course-teacher-row">
                <span>{course.instructor?.name}</span>

                <span>
                  <Star size={12} />
                  {Number.isFinite(rating) ? rating.toFixed(1) : "0.0"} (
                  {course.reviews ?? 0})
                </span>
              </div>

              {!isFavorite && (
                <>
                  <div className="profile-course-progress-bar">
                    <div
                      className="profile-course-progress-fill"
                      style={{
                        width: `${Math.min(Math.max(progress, 0), 100)}%`,
                      }}
                    />
                  </div>

                  <div className="profile-course-meta">
                    <span>
                      {course.lessonsDone ?? 0} / {course.lessonsTotal ?? 0}{" "}
                      lessons
                    </span>

                    <span>
                      {isCompleted ? "Completed" : course.remaining}
                    </span>
                  </div>
                </>
              )}

              {isFavorite && course.price && (
                <div className="profile-course-price">{course.price}</div>
              )}

              <button
                className={`profile-course-action-btn${
                  isCompleted ? " completed" : ""
                }`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCourse?.(course);
                }}
              >
                {isCompleted ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <Play size={13} />
                )}

                {isFavorite
                  ? "View Course"
                  : isCompleted
                    ? "Course Completed"
                    : "Continue Learning"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default CourseCardGrid;