import { useEffect, useState } from "react";
import { getTeacherDashboard } from "../../../../infrastructure/api/teacher/Dashboard";
import { getFileUrl } from "../../../../infrastructure/api/teacher/CoursesApi";

export const useDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const dashboard = await getTeacherDashboard();

        const topCourses = await Promise.all(
          (dashboard.topCourses ?? []).map(async (course) => {
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
        setData({ ...dashboard, topCourses });
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
