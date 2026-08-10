import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { studentTableColumns } from "../data/studentsPageData";
import StudentRow from "./StudentRow";

const ITEMS_PER_PAGE = 7;

const StudentsTable = ({ students, onViewDetail }) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [students]);

  const totalPages = Math.max(1, Math.ceil(students.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStudents = students.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="teacher-students-panel">
      <div className="teacher-students-table-head">
        {studentTableColumns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>

      {paginatedStudents.map((student) => (
        <StudentRow key={student.email} student={student} onViewDetail={onViewDetail} />
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
          <span>
            Page {currentPage} of {totalPages}
          </span>
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

export default StudentsTable;
