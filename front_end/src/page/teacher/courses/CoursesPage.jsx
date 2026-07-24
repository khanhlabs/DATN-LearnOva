import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BookOpen, CheckCircle2, Star, Users } from "lucide-react";
import {getMyCourses, getFileUrl, getActiveCategories, softDeleteCourse, toggleCourseVisibility,} from "../../../api/teacher/CourseApi.js";
import {buildCategoryOptions, getFilteredCourses,} from "./coursePageConfig.js";
import CoursesTable from "./components/CoursesTable.jsx";
import CoursesToolbar from "./components/CoursesToolbar.jsx";
import DeleteConfirmModal from "./components/DeleteConfirmModal.jsx";
import CourseDetailModal from "./components/CourseDetailModal.jsx";
import "./CoursesPage.css";

const COURSES_CREATE_PATH = "/learnova/teacher/courses/create";

const formatTimeAgo = (isoString) => {
  if (!isoString) return "-";
  const diffInDays = Math.floor((new Date() - new Date(isoString)) / (1000 * 60 * 60 * 24));
  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 30) return `${diffInDays} days ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
};

const CoursesPage = () => {
  const navigate = useNavigate();
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [activeRating, setActiveRating] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState({ open: false, courseId: null, courseName: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailCourse, setDetailCourse] = useState(null);
  const [allCategories, setAllCategories] = useState([]);

  useEffect(() => {
    getActiveCategories()
      .then((data) => setAllCategories(Array.isArray(data) ? data : []))
      .catch(() => setAllCategories([]));
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const coursesData = await getMyCourses();

        const transformedCourses = await Promise.all(
          coursesData.map(async (course) => {
            const isPublished = course.status === "PUBLISHED";

            const createdAgo = formatTimeAgo(course.createdAt);
            const updatedAgo = formatTimeAgo(course.updatedAt);

            let thumbnailUrl = "/default-course-thumbnail.jpg";
            if (course.thumbnailKey) {
              try {
                thumbnailUrl = await getFileUrl(course.thumbnailKey);
              } catch {
                // fallback to default
              }
            }

            return {
              id: course.courseId,
              title: course.title,
              thumbnailKey: course.thumbnailKey,
              image: thumbnailUrl,
              status: course.status,
              courseStatus: course.status,
              rejectionReason: course.rejectionReason ?? null,
              basePrice: course.basePrice,
              displayPrice: isPublished ? `$${course.basePrice || 0}` : "-",
              createdAt: course.createdAt,
              updatedAt: course.updatedAt,
              createdAgo,
              updatedAgo,
              isHidden: course.isHidden ?? false,
              category: course.categoryName || "Uncategorized",
              modules: course.lessonCount ?? 0,
              totalDurationSeconds: course.totalDurationSeconds ?? 0,
              studentCount: course.studentCount ?? 0,
              students: `${course.studentCount ?? 0} students`,
              rating: isPublished ? Number(course.avgRating ?? 0).toFixed(1) : "-",
              ratingCount: course.ratingCount ?? 0,
            };
          })
        );

        setTeacherCourses(transformedCourses);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const categoryOptions = useMemo(() => buildCategoryOptions(allCategories), [allCategories]);

  const summary = useMemo(() => {
    const total = teacherCourses.length;
    const published = teacherCourses.filter((c) => c.status === "PUBLISHED").length;
    const totalStudents = teacherCourses.reduce((sum, c) => sum + (c.studentCount || 0), 0);
    const ratedCourses = teacherCourses.filter((c) => c.ratingCount > 0);
    const avgRating =
      ratedCourses.length > 0
        ? (ratedCourses.reduce((sum, c) => sum + Number(c.rating), 0) / ratedCourses.length).toFixed(1)
        : "0.0";
    return { total, published, totalStudents, avgRating };
  }, [teacherCourses]);

  const activeCourses = useMemo(
    () =>
      getFilteredCourses({
        activeCategory,
        activeFilter,
        activeRating,
        courses: teacherCourses,
        searchTerm,
      }),
    [activeCategory, activeFilter, activeRating, searchTerm, teacherCourses]
  );

  const handleCreateCourse = () => {
    navigate(COURSES_CREATE_PATH);
  };

  const handleUpdateCourse = (course) => {
    navigate(`/learnova/teacher/courses/edit/${course.id}`);
  };

  const handleDeleteClick = (course) => {
    setDeleteModal({ open: true, courseId: course.id, courseName: course.title });
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await softDeleteCourse(deleteModal.courseId);
      setTeacherCourses((courses) => courses.filter((c) => c.id !== deleteModal.courseId));
      toast.success("Course deleted successfully.");
    } catch (err) {
      toast.error("Failed to delete course. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteModal({ open: false, courseId: null, courseName: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ open: false, courseId: null, courseName: "" });
  };

  const handleViewDetail = (course) => {
    setDetailCourse(course);
  };

  const handleClearFilters = () => {
    setActiveFilter("ALL");
    setActiveCategory("ALL");
    setActiveRating("ALL");
    setSearchTerm("");
  };

  const handleToggleVisibility = async (course) => {
    try {
      await toggleCourseVisibility(course.id);
      setTeacherCourses((courses) =>
        courses.map((c) =>
          c.id === course.id ? { ...c, isHidden: !c.isHidden } : c
        )
      );
      toast.success(course.isHidden ? "Course is now visible to students." : "Course hidden from students.");
    } catch {
      toast.error("Failed to update course visibility.");
    }
  };

  if (isLoading) {
    return (
      <section className="teacher-courses-page">
        <div style={{ textAlign: "center", padding: "2rem" }}>
          Loading courses...
        </div>
      </section>
    );
  }

  return (
    <section className="teacher-courses-page">
      <div className="teacher-summary">
        <div className="teacher-summary-item">
          <span className="teacher-summary-item__icon teacher-summary-item__icon--blue">
            <BookOpen size={20} />
          </span>
          <div className="teacher-summary-item__body">
            <strong>{summary.total}</strong>
            <span>Total courses</span>
          </div>
        </div>
        <div className="teacher-summary-item">
          <span className="teacher-summary-item__icon teacher-summary-item__icon--green">
            <CheckCircle2 size={20} />
          </span>
          <div className="teacher-summary-item__body">
            <strong>{summary.published}</strong>
            <span>Published</span>
          </div>
        </div>
        <div className="teacher-summary-item">
          <span className="teacher-summary-item__icon teacher-summary-item__icon--violet">
            <Users size={20} />
          </span>
          <div className="teacher-summary-item__body">
            <strong>{summary.totalStudents}</strong>
            <span>Total Students</span>
          </div>
        </div>
        <div className="teacher-summary-item">
          <span className="teacher-summary-item__icon teacher-summary-item__icon--gold">
            <Star size={20} />
          </span>
          <div className="teacher-summary-item__body">
            <strong>{summary.avgRating}</strong>
            <span>Average rating</span>
          </div>
        </div>
      </div>

      <CoursesToolbar
        activeCategory={activeCategory}
        activeFilter={activeFilter}
        activeRating={activeRating}
        categoryOptions={categoryOptions}
        onCategoryChange={setActiveCategory}
        onCreateCourse={handleCreateCourse}
        onFilterChange={setActiveFilter}
        onRatingChange={setActiveRating}
        onSearchChange={setSearchTerm}
        searchTerm={searchTerm}
      />

      {activeCourses.length > 0 ? (
        <CoursesTable
          courses={activeCourses}
          onDeleteCourse={handleDeleteClick}
          onUpdateCourse={handleUpdateCourse}
          onToggleVisibility={handleToggleVisibility}
          onViewDetail={handleViewDetail}
        />
      ) : teacherCourses.length > 0 ? (
        <div className="teacher-courses-empty">
          <p>No courses match your filters.</p>
          <button type="button" onClick={handleClearFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="teacher-courses-empty">
          <p>You haven't created any courses yet.</p>
          <button type="button" onClick={handleCreateCourse}>
            Create your first course
          </button>
        </div>
      )}

      {deleteModal.open && (
        <DeleteConfirmModal
          courseName={deleteModal.courseName}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isDeleting={isDeleting}
        />
      )}

      {detailCourse && (
        <CourseDetailModal
          course={detailCourse}
          onClose={() => setDetailCourse(null)}
        />
      )}
    </section>
  );
};

export default CoursesPage;
