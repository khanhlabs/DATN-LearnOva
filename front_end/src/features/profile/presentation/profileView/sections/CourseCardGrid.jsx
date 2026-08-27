import { Heart, Play, RotateCcw, Star } from "lucide-react";

const CourseCardGrid = ({
  courses = [],
  onOpenCourse,
  onRestartCourse,
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
        // Clicking a card opens its learning-detail page. That page owns the
        // explicit "Continue Learning" action which takes the user to the player.
        const openCourse = () => onOpenCourse?.(course);

        return (
          <article
            key={course.id ?? `${course.title}-${index}`}
            className="profile-course-card"
            onClick={openCourse}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                openCourse();
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
                  if (isCompleted) onRestartCourse?.(course);
                  else onOpenCourse?.(course);
                }}
              >
                {isCompleted ? (
                  <RotateCcw size={13} />
                ) : (
                  <Play size={13} />
                )}

                {isFavorite
                  ? "View Course"
                  : isCompleted
                    ? "Restart Course"
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
