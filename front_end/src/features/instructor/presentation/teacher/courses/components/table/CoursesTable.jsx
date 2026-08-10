import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { courseTableColumns } from "../../utils/CourseConfig";
import CourseCard from "../card/CourseCard";

const ITEMS_PER_PAGE = 7;

const CoursesTable = ({ courses, onDeleteCourse, onUpdateCourse, onToggleVisibility, onViewDetail }) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [courses]);

  const totalPages = Math.max(1, Math.ceil(courses.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCourses = courses.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="teacher-course-table">
      <div className="teacher-course-table__head">
        {courseTableColumns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>

      {paginatedCourses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          onDelete={onDeleteCourse}
          onUpdate={onUpdateCourse}
          onToggleVisibility={onToggleVisibility}
          onViewDetail={onViewDetail}
        />
      ))}

      {totalPages > 1 && (
        <div className="teacher-course-table__pagination">
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
    </div>
  );
};

export default CoursesTable;
