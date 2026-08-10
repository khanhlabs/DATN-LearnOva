import { DollarSign, GraduationCap, Star, TrendingUp, Users } from "lucide-react";

export const STATUS_LABELS = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending Review",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
  HIDDEN: "Hidden",
};

export const courseStatusFilterOptions = [
  { label: "All Status", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Pending Review", value: "PENDING_REVIEW" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Hidden", value: "HIDDEN" },
];

export const courseRatingFilterOptions = [
  { label: "All Ratings", value: "ALL" },
  { label: "4 Stars & Up", value: "4" },
  { label: "3 Stars & Up", value: "3" },
  { label: "2 Stars & Up", value: "2" },
  { label: "1 Star & Up", value: "1" },
];

export const courseTableColumns = ["Course", "Status", "Students", "Price", "Rating", "Updated", "Actions"];

export const parseCourseNumber = (value) => Number(String(value).replace(/[^\d.]/g, "")) || 0;

// Strips Vietnamese diacritics so search matches regardless of accents (e.g. "lap trinh"
// finds the accented title). The "d with stroke" letter doesn't decompose via NFD since
// it's a distinct base letter, not a base letter + combining mark, so it's handled separately.
const stripDiacritics = (value) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

export const buildCategoryOptions = (allCategories) => [
  "ALL",
  ...allCategories.map((category) => category.name),
];

export const getFilteredCourses = ({ courses, activeFilter, activeCategory, activeRating, searchTerm }) => {
  const normalizedSearch = stripDiacritics(searchTerm.trim().toLowerCase());

  return courses.filter((course) => {
    const matchesFilter =
      activeFilter === "ALL" ||
      (activeFilter === "HIDDEN"
        ? course.isHidden
        : course.courseStatus === activeFilter && !course.isHidden);
    const matchesCategory = activeCategory === "ALL" || course.category === activeCategory;
    const matchesRating = activeRating === "ALL" || parseCourseNumber(course.rating) >= Number(activeRating);
    const matchesSearch =
      !normalizedSearch ||
      stripDiacritics(course.title.toLowerCase()).includes(normalizedSearch) ||
      stripDiacritics(course.category.toLowerCase()).includes(normalizedSearch);

    return matchesFilter && matchesCategory && matchesRating && matchesSearch;
  });
};
