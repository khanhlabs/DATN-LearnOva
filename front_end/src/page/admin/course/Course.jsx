import { useEffect, useMemo, useState } from "react";
import { useAxiosPrivate } from "../../../hook/UseAxiosPrivate.js";
import { getAdminCategoriesApi } from "../../../api/admin/CategoryApi.js";
import { getAdminCourseDetailApi, getAdminCoursesApi } from "../../../api/admin/CourseApi.js";
import { getAdminInstructorsApi } from "../../../api/admin/InstructorApi.js";
import CourseFilters from "./filters/CourseFilters";
import CourseStatistics from "./statistics/CourseStatistics";
import CourseTable from "./courseTable/CourseTable";
import "./Course.css";

const mergeInstructorOptions = (apiInstructors = [], courseData = []) => {
  const instructorMap = new Map();

  apiInstructors.forEach((instructor) => {
    const instructorId = instructor.instructorId ?? instructor.id;
    if (!instructorId) return;

    instructorMap.set(String(instructorId), {
      instructorId,
      fullName:
        instructor.fullName ||
        instructor.email ||
        instructor.instructorName ||
        `Instructor #${instructorId}`,
      email: instructor.email,
    });
  });

  courseData.forEach((course) => {
    if (!course.instructorId || instructorMap.has(String(course.instructorId))) {
      return;
    }

    instructorMap.set(String(course.instructorId), {
      instructorId: course.instructorId,
      fullName: course.instructorName || `Instructor #${course.instructorId}`,
    });
  });

  return Array.from(instructorMap.values());
};

const normalizeCategory = (category) => ({
  id: category.id,
  name: category.name ?? "N/A",
  parentId: category.parentId ?? null,
  parentName: category.parentName ?? null,
  isDeleted: Boolean(category.isDeleted),
});

const mergeCategoryOptions = (apiCategories = [], courseData = []) => {
  const categoryMap = new Map();

  apiCategories.forEach((category) => {
    if (!category.id) return;
    categoryMap.set(String(category.id), normalizeCategory(category));
  });

  courseData.forEach((course) => {
    if (!course.categoryId || categoryMap.has(String(course.categoryId))) return;
    categoryMap.set(String(course.categoryId), {
      id: course.categoryId,
      name: course.categoryName || `Category #${course.categoryId}`,
      parentId: null,
      parentName: null,
      isDeleted: false,
    });
  });

  return Array.from(categoryMap.values());
};

const normalizeCourse = (course) => ({
  ...course,
  id: course.id,
  thumbnailKey: course.thumbnailKey ?? "",
  title: course.title ?? "N/A",
  slug: course.slug ?? "",
  description: course.description ?? "",
  language: course.language ?? "N/A",
  requirements: Array.isArray(course.requirements) ? course.requirements : [],
  whatYouLearn: Array.isArray(course.whatYouLearn) ? course.whatYouLearn : [],
  basePrice: course.basePrice ?? 0,
  level: course.level ?? "N/A",
  status: course.status ?? "N/A",
  instructorId: course.instructorId ?? null,
  instructorName: course.instructorName ?? "N/A",
  categoryId: course.categoryId ?? null,
  categoryName: course.categoryName ?? null,
  publishedAt: course.publishedAt ?? null,
  lessonCount: course.lessonCount ?? 0,
  totalDurationSeconds: course.totalDurationSeconds ?? 0,
  sections: Array.isArray(course.sections) ? course.sections : [],
});

const mergeCourseListAndDetail = (course, detail) => ({
  ...course,
  ...detail,
  slug: course.slug,
  categoryId: course.categoryId ?? detail.categoryId,
  categoryName: course.categoryName ?? detail.categoryName,
});

const defaultFilters = {
  searchText: "",
  categoryId: "all",
  instructorId: "all",
  publishSort: "newest",
  priceType: "all",
};

const getPublishedTime = (course) => {
  const time = new Date(course.publishedAt || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const Course = () => {
  const axiosPrivate = useAxiosPrivate();
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(defaultFilters);

  useEffect(() => {
    let isMounted = true;
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError("");
        const [courseData, instructorData, categoryData] = await Promise.all([
          getAdminCoursesApi(axiosPrivate),
          getAdminInstructorsApi(axiosPrivate).catch(() => []),
          getAdminCategoriesApi(axiosPrivate).catch(() => []),
        ]);
        const courseList = Array.isArray(courseData) ? courseData : [];
        const normalizedCourses = courseList.map(normalizeCourse);

        if (isMounted) {
          setCourses(normalizedCourses);
          setInstructors(
            mergeInstructorOptions(
              Array.isArray(instructorData) ? instructorData : [],
              normalizedCourses,
            ),
          );
          setCategories(
            mergeCategoryOptions(
              Array.isArray(categoryData) ? categoryData : [],
              normalizedCourses,
            ),
          );
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError?.response?.data?.message || "Could not load the course list.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCourses();
    return () => {
      isMounted = false;
    };
  }, [axiosPrivate]);

  const loadCourseDetail = async (course) => {
    const detail = await getAdminCourseDetailApi(course.id, axiosPrivate);
    return normalizeCourse(mergeCourseListAndDetail(course, detail));
  };

  const filteredCourses = useMemo(() => {
    const searchValue = filters.searchText.trim().toLowerCase();

    return courses
      .filter((course) => {
        if (!searchValue) return true;

        const searchableText = [
          course.title,
          course.slug,
          course.instructorName,
          course.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(searchValue);
      })
      .filter((course) => {
        if (filters.categoryId === "all") return true;
        return String(course.categoryId) === filters.categoryId;
      })
      .filter((course) => {
        if (filters.instructorId === "all") return true;
        return String(course.instructorId) === filters.instructorId;
      })
      .filter((course) => {
        const price = Number(course.basePrice || 0);
        if (filters.priceType === "free") return price <= 0;
        if (filters.priceType === "paid") return price > 0;
        return true;
      })
      .sort((firstCourse, secondCourse) => {
        const firstTime = getPublishedTime(firstCourse);
        const secondTime = getPublishedTime(secondCourse);
        return filters.publishSort === "oldest"
          ? firstTime - secondTime
          : secondTime - firstTime;
      });
  }, [courses, filters]);

  return (
    <section className="coursePage" aria-label="Course management">
      <div className="courseContent">
        <CourseStatistics courses={courses} loading={loading} />
        <CourseFilters
          filters={filters}
          instructors={instructors}
          categories={categories}
          onFiltersChange={setFilters}
        />
        <CourseTable
          courses={filteredCourses}
          loading={loading}
          error={error}
          onViewCourse={loadCourseDetail}
        />
      </div>
    </section>
  );
};

export default Course;
