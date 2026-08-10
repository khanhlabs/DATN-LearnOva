import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 6;

const CoursePerformancePanel = ({ courses = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [courses]);

  const totalPages = Math.max(1, Math.ceil(courses.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pagedCourses = courses.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <section className="teacher-analytics-panel-wrap">
      <header className="teacher-analytics-panel-title">
        <h2>Course Performance</h2>
      </header>

      <article className="teacher-analytics-panel teacher-analytics-course-table">
        <table>
          <colgroup>
            <col style={{ width: "46%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "16%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>Course</th>
              <th>Completion Rate</th>
              <th>Rating</th>
              <th>Students</th>
            </tr>
          </thead>
          <tbody>
            {pagedCourses.length === 0 ? (
              <tr>
                <td colSpan={4} className="teacher-analytics-empty">You don't have any courses yet.</td>
              </tr>
            ) : (
              pagedCourses.map((course) => (
                <tr key={course.courseId}>
                  <td>
                    <span className="teacher-analytics-course-table__course" title={course.title}>
                      {course.title}
                    </span>
                  </td>
                  <td>{course.completionRate.toFixed(0)}%</td>
                  <td>{course.avgRating.toFixed(1)} ★</td>
                  <td>{course.studentCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="teacher-analytics-course-table__pagination">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </article>
    </section>
  );
};

export default CoursePerformancePanel;
