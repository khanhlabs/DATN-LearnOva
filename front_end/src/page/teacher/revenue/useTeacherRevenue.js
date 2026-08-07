import { useEffect, useState } from "react";
import { getTeacherRevenue } from "../../../api/teacher/RevenueApi.js";
import { getFileUrl } from "../../../api/teacher/CoursesApi.js";

export const useTeacherRevenue = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const revenue = await getTeacherRevenue();

        const topCourses = await Promise.all(
          (revenue.topCourses ?? []).map(async (course) => {
            let thumbnailUrl = "/default-course-thumbnail.jpg";
            if (course.thumbnailKey) {
              try {
                thumbnailUrl = await getFileUrl(course.thumbnailKey);
              } catch {
                // fallback to default
              }
            }
            return { ...course, thumbnailUrl };
          })
        );

        if (!isMounted) return;
        setData({ ...revenue, topCourses });
        setError(null);
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, isLoading, error };
};
