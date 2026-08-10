export const initialPromotions = {};

export const promotionStatusFilterOptions = [
  { value: "ALL", label: "All Status" },
  { value: "ACTIVE", label: "Active Promotion" },
  { value: "INACTIVE", label: "No Promotion" },
];

export const emptyPromotionForm = {
  basePrice: "",
  percent: "",
  startDate: "",
  endDate: "",
};

export const formatPromotionCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

export const createPromotionFormValues = (course, existingPromotion) => ({
  basePrice: course.basePrice,
  percent: existingPromotion?.percent ?? 15,
  startDate: existingPromotion?.startDate ?? new Date().toISOString().slice(0, 10),
  endDate: existingPromotion?.endDate ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
});

export const calculatePromotionFinalPrice = (formValues) =>
  Math.max(0, Number(formValues.basePrice || 0) * (1 - Number(formValues.percent || 0) / 100));

export const buildPromotionCategoryOptions = (courses) => [
  "ALL",
  ...Array.from(new Set(courses.map((course) => course.category).filter(Boolean))),
];

export const filterPromotionCourses = ({ courses, query, statusFilter = "ALL", categoryFilter = "ALL", promotions = {} }) => {
  const normalizedQuery = query.trim().toLowerCase();
  return courses.filter((course) => {
    if (course.isDeleted) return false;

    const matchesQuery =
      !normalizedQuery ||
      course.title.toLowerCase().includes(normalizedQuery) ||
      course.category.toLowerCase().includes(normalizedQuery);

    const hasPromotion = Boolean(promotions[course.id]);
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && hasPromotion) ||
      (statusFilter === "INACTIVE" && !hasPromotion);

    const matchesCategory = categoryFilter === "ALL" || course.category === categoryFilter;

    return matchesQuery && matchesStatus && matchesCategory;
  });
};
