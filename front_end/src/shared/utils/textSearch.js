// Strips Vietnamese diacritics so search matches regardless of accents (e.g. "nguyen van a"
// finds "Nguyễn Văn A"). "d with stroke" doesn't decompose via NFD since it's a distinct
// base letter, not a base letter + combining mark, so it's handled separately.
export const stripDiacritics = (value) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

export const buildCourseFilterOptions = (items, getCourses) => {
  const seen = new Map();
  items.forEach((item) => {
    getCourses(item).forEach(([courseId, courseTitle]) => {
      if (!seen.has(courseId)) {
        seen.set(courseId, courseTitle);
      }
    });
  });

  return [
    { label: "Tất cả khóa học", value: "ALL" },
    ...Array.from(seen, ([courseId, courseTitle]) => ({
      label: courseTitle,
      value: String(courseId),
    })),
  ];
};
