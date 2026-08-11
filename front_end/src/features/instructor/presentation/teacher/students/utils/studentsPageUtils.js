import { stripDiacritics, buildCourseFilterOptions as buildFilterOptions } from "../../../../../../shared/utils/textSearch";

export const buildCourseFilterOptions = (students) =>
  buildFilterOptions(students, (student) => student.courses.map((c) => [c.courseId, c.courseTitle]));

export const filterStudents = ({ students, query, statusFilter = "ALL", courseFilter = "ALL" }) => {
  const normalizedQuery = stripDiacritics(query.trim().toLowerCase());

  return students.filter((student) => {
    const matchesStatus = statusFilter === "ALL" || student.status === statusFilter;
    const matchesCourse =
      courseFilter === "ALL" || student.courses.some((c) => String(c.courseId) === courseFilter);

    const matchesQuery =
      !normalizedQuery ||
      stripDiacritics(
        [student.fullName, student.email, student.phone, ...student.courses.map((c) => c.courseTitle)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
      ).includes(normalizedQuery);

    return matchesStatus && matchesCourse && matchesQuery;
  });
};
