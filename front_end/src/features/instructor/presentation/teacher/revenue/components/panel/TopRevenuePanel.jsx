import { formatCurrency } from "../../data/revenuePageData";

const TopRevenuePanel = ({ courses = [] }) => (
  <section className="teacher-revenue-panel-wrap">
    <header className="teacher-revenue-panel-title">
      <h2>Top revenue courses</h2>
    </header>

    <article className="teacher-revenue-panel teacher-revenue-top-courses">
      <div className="teacher-revenue-course-list">
        {courses.length === 0 ? (
          <p className="teacher-revenue-empty">No revenue yet.</p>
        ) : (
          courses.map((course) => (
            <div key={course.courseId} className="teacher-revenue-course-item">
              <img src={course.thumbnailUrl} alt={course.title} />
              <div className="teacher-revenue-course-item__body">
                <strong>{course.title}</strong>
                <span>{course.studentCount} students</span>
              </div>
              <b>{formatCurrency(course.revenue)}</b>
            </div>
          ))
        )}
      </div>
    </article>
  </section>
);

export default TopRevenuePanel;
