import { useEffect, useState } from "react";
import { getTeacherAnalytics } from "../../../../infrastructure/api/teacher/AnalyticsApi";

export const useTeacherAnalytics = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    getTeacherAnalytics()
      .then((analytics) => {
        if (isMounted) setData(analytics);
      })
      .catch((err) => {
        if (isMounted) setError(err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, isLoading, error };
};
