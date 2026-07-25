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



const CourseDetailSidebar = ({ course, certificate, onDownloadCertificate }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (course.progress / 100) * circumference;

  const infoRows = [
    { icon: User, label: "Instructor", value: course.instructor.name },
    { icon: Clock, label: "Duration", value: course.duration },
    { icon: Users, label: "Students", value: course.students },
    { icon: BookOpen, label: "Lessons", value: course.lessonsTotal },
    { icon: Calendar, label: "Last Updated", value: course.updatedAt },
    { icon: BarChart3, label: "Level", value: course.level },
  ];
  const navigate = useNavigate();

  return (
    <aside className="learning-detail-sidebar">
      <section className="learning-side-card">
        <h3>Learning Progress</h3>

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
            <span>Completed</span>
          </div>
        </div>

        <p>You have completed</p>

        <strong className="learning-finished">
          {course.lessonsDone} / {course.lessonsTotal} lessons
        </strong>

        <div className="learning-linear-progress">
          <span style={{ width: `${course.progress}%` }} />
        </div>

        <small>Keep it up! You're making great progress.</small>

        {course.progress === 100 ? (
            <>
              <button className="learning-primary-button completed" type="button">
                <Play size={16} fill="white" />
                Course Completed
              </button>
              {certificate && (
                <button
                    className="learning-secondary-button"
                    type="button"
                    onClick={onDownloadCertificate}
                >
                  <Download size={16} />
                  Download Certificate
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
              Continue Learning
            </button>
        )}

        <button className="learning-secondary-button" type="button">
          <RotateCcw size={16} />
          Restart Course
        </button>
      </section>

      <section className="learning-side-card">
        <h3>Course Information</h3>

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
