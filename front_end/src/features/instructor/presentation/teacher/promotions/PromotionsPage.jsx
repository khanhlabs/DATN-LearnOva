import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { getMyCourses, getFileUrl } from "../../../infrastructure/api/teacher/CoursesApi";
import { getMyPromotions, createPromotion, updatePromotion } from "../../../infrastructure/api/teacher/PromotionApi";
import PromotionCard from "./components/PromotionCard";
import PromotionModal from "./components/PromotionModal";
import PromotionsToolbar from "./components/PromotionsToolbar";
import {
  buildPromotionCategoryOptions,
  calculatePromotionFinalPrice,
  createPromotionFormValues,
  emptyPromotionForm,
  filterPromotionCourses,
} from "./utils/PromotionConfig";
import "./PromotionsPage.css";

const ITEMS_PER_PAGE = 8;

const PromotionsPage = () => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // { [courseId]: { promotionId, percent, startDate, endDate } }
  const [promotions, setPromotions] = useState({});
  const [formValues, setFormValues] = useState(emptyPromotionForm);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [coursesData, promotionsData] = await Promise.all([
          getMyCourses(),
          getMyPromotions(),
        ]);

        const transformed = await Promise.all(
          coursesData.map(async (course) => {
            let thumbnailUrl = "/default-course-thumbnail.jpg";
            if (course.thumbnailKey) {
              try { thumbnailUrl = await getFileUrl(course.thumbnailKey); } catch { /* fallback */ }
            }
            return {
              id: course.courseId,
              title: course.title,
              image: thumbnailUrl,
              category: course.categoryName || "Uncategorized",
              basePrice: course.basePrice ?? 0,
              modules: course.lessonCount ?? 0,
              students: `${course.studentCount ?? 0} students`,
              isDeleted: course.isDeleted ?? false,
              status: course.status,
            };
          })
        );

        // Build promotions map: { courseId -> { promotionId, percent, startDate, endDate } }
        const promotionsMap = {};
        promotionsData.forEach((p) => {
          promotionsMap[p.courseId] = {
            promotionId: p.promotionId,
            percent: p.discountPercent,
            startDate: p.startDate,
            endDate: p.endDate,
          };
        });

        setCourses(transformed);
        setPromotions(promotionsMap);
      } catch {
        toast.error("Failed to load promotions.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const categoryOptions = useMemo(() => buildPromotionCategoryOptions(courses), [courses]);

  const promotionCourses = useMemo(
    () => filterPromotionCourses({ courses, query, statusFilter, categoryFilter, promotions }),
    [courses, query, statusFilter, categoryFilter, promotions],
  );

  const totalPages = Math.max(1, Math.ceil(promotionCourses.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedCourses = promotionCourses.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleQueryChange = (q) => { setQuery(q); setCurrentPage(1); };
  const handleStatusFilterChange = (value) => { setStatusFilter(value); setCurrentPage(1); };
  const handleCategoryFilterChange = (value) => { setCategoryFilter(value); setCurrentPage(1); };

  const openPromotionModal = (course) => {
    const existing = promotions[course.id];
    setSelectedCourse(course);
    setFormValues(createPromotionFormValues(course, existing));
  };

  const closePromotionModal = () => {
    if (!isSaving) setSelectedCourse(null);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((v) => ({ ...v, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedCourse) return;

    const existing = promotions[selectedCourse.id];
    const payload = {
      discountPercent: Number(formValues.percent),
      startDate: formValues.startDate,
      endDate: formValues.endDate,
    };

    setIsSaving(true);
    try {
      let result;
      if (existing?.promotionId) {
        result = await updatePromotion(existing.promotionId, payload);
      } else {
        result = await createPromotion({ courseId: selectedCourse.id, ...payload });
      }

      setPromotions((p) => ({
        ...p,
        [selectedCourse.id]: {
          promotionId: result.promotionId,
          percent: result.discountPercent,
          startDate: result.startDate,
          endDate: result.endDate,
        },
      }));
      toast.success(existing?.promotionId ? "Promotion updated." : "Promotion created.");
      setSelectedCourse(null);
    } catch {
      toast.error("Failed to save promotion. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const finalPrice = calculatePromotionFinalPrice(formValues);

  if (isLoading) {
    return (
      <section className="teacher-page teacher-promotions-page">
        <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
          Loading courses...
        </div>
      </section>
    );
  }

  return (
    <section className="teacher-page teacher-promotions-page">
      <PromotionsToolbar
        query={query}
        onQueryChange={handleQueryChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={handleCategoryFilterChange}
        categoryOptions={categoryOptions}
      />

      {pagedCourses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
          No courses found.
        </div>
      ) : (
        <div className="teacher-promotions-grid">
          {pagedCourses.map((course) => (
            <PromotionCard
              key={course.id}
              course={course}
              promotion={promotions[course.id]}
              onSetPromotion={openPromotionModal}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="teacher-promotions-pagination">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span>Page {safePage} of {totalPages}</span>
          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {selectedCourse && (
        <PromotionModal
          course={selectedCourse}
          formValues={formValues}
          finalPrice={finalPrice}
          isSaving={isSaving}
          onClose={closePromotionModal}
          onFormChange={handleFormChange}
          onSubmit={handleSubmit}
        />
      )}
    </section>
  );
};

export default PromotionsPage;
