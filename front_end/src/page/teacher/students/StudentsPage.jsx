import { useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { toast } from "react-toastify";
import StudentsTable from "./components/StudentsTable.jsx";
import StudentsToolbar from "./components/StudentsToolbar.jsx";
import StudentDetailModal from "./components/StudentDetailModal.jsx";
import { getMyStudents } from "../../../api/teacher/StudentApi.js";
import { buildCourseFilterOptions, filterStudents } from "./studentsPageUtils.js";
import "./StudentsPage.css";

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [detailStudent, setDetailStudent] = useState(null);

  useEffect(() => {
    getMyStudents()
      .then(setStudents)
      .catch(() => toast.error("Failed to load students."))
      .finally(() => setIsLoading(false));
  }, []);

  const courseFilterOptions = useMemo(() => buildCourseFilterOptions(students), [students]);

  const summary = useMemo(() => {
    const total = students.length;
    const inProgress = students.filter((s) => s.status === "IN_PROGRESS").length;
    const completed = students.filter((s) => s.status === "COMPLETED").length;
    const avgProgress =
      total > 0
        ? Math.round(students.reduce((sum, s) => sum + (s.progressPercent || 0), 0) / total)
        : 0;
    return { total, inProgress, completed, avgProgress };
  }, [students]);

  const filteredStudents = useMemo(
    () => filterStudents({ students, query, statusFilter, courseFilter }),
    [students, query, statusFilter, courseFilter]
  );

  if (isLoading) {
    return (
      <section className="teacher-page teacher-students-page">
        <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
          Loading students...
        </div>
      </section>
    );
  }

  return (
    <section className="teacher-page teacher-students-page">
      <div className="teacher-summary">
        <div className="teacher-summary-item">
          <span className="teacher-summary-item__icon teacher-summary-item__icon--blue">
            <Users size={20} />
          </span>
          <div className="teacher-summary-item__body">
            <strong>{summary.total}</strong>
            <span>Total students</span>
          </div>
        </div>
        <div className="teacher-summary-item">
          <span className="teacher-summary-item__icon teacher-summary-item__icon--violet">
            <TrendingUp size={20} />
          </span>
          <div className="teacher-summary-item__body">
            <strong>{summary.inProgress}</strong>
            <span>In Progress</span>
          </div>
        </div>
        <div className="teacher-summary-item">
          <span className="teacher-summary-item__icon teacher-summary-item__icon--green">
            <CheckCircle2 size={20} />
          </span>
          <div className="teacher-summary-item__body">
            <strong>{summary.completed}</strong>
            <span>Completed</span>
          </div>
        </div>
        <div className="teacher-summary-item">
          <span className="teacher-summary-item__icon teacher-summary-item__icon--gold">
            <BarChart3 size={20} />
          </span>
          <div className="teacher-summary-item__body">
            <strong>{summary.avgProgress}%</strong>
            <span>Average progress</span>
          </div>
        </div>
      </div>

      <StudentsToolbar
        query={query}
        onQueryChange={setQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        courseFilter={courseFilter}
        onCourseFilterChange={setCourseFilter}
        courseFilterOptions={courseFilterOptions}
      />
      <StudentsTable students={filteredStudents} onViewDetail={setDetailStudent} />

      {detailStudent && (
        <StudentDetailModal
          student={detailStudent}
          onClose={() => setDetailStudent(null)}
        />
      )}
    </section>
  );
};

export default StudentsPage;
