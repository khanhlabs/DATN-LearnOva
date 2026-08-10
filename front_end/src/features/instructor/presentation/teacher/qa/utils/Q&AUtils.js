import { stripDiacritics, buildCourseFilterOptions as buildFilterOptions } from "../../../../../../shared/utils/textSearch";

export const buildCourseFilterOptions = (questions) =>
  buildFilterOptions(questions, (question) => [[question.courseId, question.courseTitle]]);

export const filterQuestions = ({ questions, query, statusFilter = "all", courseFilter = "ALL" }) => {
  const normalizedQuery = stripDiacritics(query.trim().toLowerCase());

  return questions.filter((question) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "unsolved" && !question.isSolved) ||
      (statusFilter === "solved" && question.isSolved) ||
      (statusFilter === "pinned" && question.isPinned);

    const matchesCourse = courseFilter === "ALL" || String(question.courseId) === courseFilter;

    const matchesQuery =
      !normalizedQuery ||
      stripDiacritics(
        [question.userName, question.courseTitle, question.lessonTitle, question.content]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
      ).includes(normalizedQuery);

    return matchesStatus && matchesCourse && matchesQuery;
  });
};
