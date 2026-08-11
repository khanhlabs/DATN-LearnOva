import { stripDiacritics, buildCourseFilterOptions as buildFilterOptions } from "../../../../../../shared/utils/textSearch";

export const buildCourseFilterOptions = (reviews) =>
  buildFilterOptions(reviews, (review) => [[review.courseId, review.courseTitle]]);

export const filterReviews = ({ reviews, query, ratingFilter = "all", courseFilter = "ALL" }) => {
  const normalizedQuery = stripDiacritics(query.trim().toLowerCase());

  return reviews.filter((review) => {
    const matchesRating = ratingFilter === "all" || review.rating === Number(ratingFilter);
    const matchesCourse = courseFilter === "ALL" || String(review.courseId) === courseFilter;

    const matchesQuery =
      !normalizedQuery ||
      stripDiacritics(
        [review.userName, review.courseTitle, review.comment].filter(Boolean).join(" ").toLowerCase()
      ).includes(normalizedQuery);

    return matchesRating && matchesCourse && matchesQuery;
  });
};
