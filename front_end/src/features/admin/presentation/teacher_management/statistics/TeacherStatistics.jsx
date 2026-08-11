import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CourseLoadCard from "./cards/courses_load/CourseLoadCard";
import StudentEnrollmentCard from "./cards/user_enrollment/StudentEnrollmentCard";
import RevenueSummaryCard from "./cards/revenue_summary/RevenueSummaryCard";
import { getAdminInstructorsApi } from "../../../infrastructure/api/InstructorApi";
import { useAxiosPrivate } from "../../../../../shared/hooks/useAxiosPrivate";
import "./TeacherStatistics.css";

const formatCurrency = (value) => {
  const amount = Number(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const formatNumber = (value) =>
  new Intl.NumberFormat("vi-VN").format(value == null ? 0 : Number(value) || 0);

const getInstructorStats = (instructors) => ({
  totalCourses: instructors.reduce((sum, instructor) => sum + (instructor.numberOfClasses ?? 0), 0),
  totalStudents: instructors.reduce((sum, instructor) => sum + (instructor.totalStudents ?? 0), 0),
  totalRevenue: instructors.reduce((sum, instructor) => sum + Number(instructor.totalRevenue ?? 0), 0),
});

/**
 * - Có props `instructors` từ parent → dùng props (không gọi API lại).
 * - Không truyền props → tự fetch bằng getAdminInstructorsApi.
 */
const TeacherStatistics = ({
  instructors: instructorsProp,
  isLoading: isLoadingProp,
  error: errorProp,
}) => {
  const { t } = useTranslation();
  const isControlled = instructorsProp !== undefined;
  const axiosPrivate = useAxiosPrivate();

  const [fetchedInstructors, setFetchedInstructors] = useState([]);
  const [fetchedLoading, setFetchedLoading] = useState(false);
  const [fetchedError, setFetchedError] = useState("");

  useEffect(() => {
    if (isControlled) return undefined;

    let mounted = true;
    const load = async () => {
      setFetchedLoading(true);
      setFetchedError("");
      try {
        const data = await getAdminInstructorsApi(axiosPrivate);
        if (!mounted) return;
        setFetchedInstructors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching instructor statistics:", error);
        if (!mounted) return;
        const errorMessage =
          error.response?.status === 403
            ? "You don't have permission to view this data"
            : error.response?.status === 401
              ? "Your session has expired. Please auth again"
              : error.message || "Failed to load instructor statistics";
        setFetchedError(errorMessage);
      } finally {
        if (mounted) setFetchedLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [isControlled, axiosPrivate]);

  const instructors = isControlled ? instructorsProp : fetchedInstructors;
  const isLoading = isControlled ? Boolean(isLoadingProp) : fetchedLoading;
  const error = isControlled ? errorProp || "" : fetchedError;
  const stats = getInstructorStats(instructors ?? []);

  return (
    <section className="instructorStatistics" aria-label="Instructor statistics">
      {error && <div className="instructorStatistics__error">{error}</div>}
      <div className="instructorStatisticsGrid">
        <div>
          <CourseLoadCard
            title={t("instructorAdmin.managedCourses")}
            value={isLoading ? "—" : String(stats.totalCourses)}
            note={t("instructorAdmin.managedCourses")}
          />
        </div>
        <div>
          <StudentEnrollmentCard
            title={t("instructorAdmin.studentEnrollment")}
            value={isLoading ? "—" : formatNumber(stats.totalStudents)}
            note={t("instructorAdmin.studentEnrollment")}
          />
        </div>
        <div>
          <RevenueSummaryCard
            title={t("instructorAdmin.systemRevenue")}
            value={isLoading ? "—" : formatCurrency(stats.totalRevenue)}
            note={t("instructorAdmin.systemRevenue")}
          />
        </div>
      </div>
    </section>
  );
};

export default TeacherStatistics;
