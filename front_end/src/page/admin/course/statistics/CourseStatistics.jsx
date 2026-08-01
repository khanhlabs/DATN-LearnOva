import TotalCoursesCard from "./cards/totalCourses/TotalCoursesCard";
import PublishedCoursesCard from "./cards/publishedCourses/PublishedCoursesCard";
import PendingReviewCard from "./cards/pendingReview/PendingReviewCard";
import SuspendedCoursesCard from "./cards/suspendedCourses/SuspendedCoursesCard";
import ReportedCoursesCard from "./cards/reportedCourses/ReportedCoursesCard";
import "./CourseStatistics.css";
import { useTranslation } from "react-i18next";

const CourseStatistics = ({ courses = [], loading = false }) => {
  const { t } = useTranslation();
  const valueOrLoading = (value) => (loading ? "..." : String(value));
  const publishedCount = courses.filter((course) => course.status === "PUBLISHED").length;
  const pendingReviewCount = courses.filter((course) => course.status === "PENDING_REVIEW").length;
  const archivedCount = courses.filter((course) => course.status === "ARCHIVED").length;
  const deletedCount = courses.filter((course) => course.status === "DELETED").length;

  const courseStatsData = [
    {
      id: "total",
      component: TotalCoursesCard,
      label: t("courseAdmin.total"),
      value: valueOrLoading(courses.length),
      trend: t("courseAdmin.database"),
      trendPercent: "",
    },
    {
      id: "published",
      component: PublishedCoursesCard,
      label: t("courseAdmin.published"),
      value: valueOrLoading(publishedCount),
      trend: t("courseAdmin.status"),
      trendPercent: "PUBLISHED",
    },
    {
      id: "pending",
      component: PendingReviewCard,
      label: t("courseAdmin.pending"),
      value: valueOrLoading(pendingReviewCount),
      trend: t("courseAdmin.status"),
      trendPercent: "PENDING_REVIEW",
    },
    {
      id: "suspended",
      component: SuspendedCoursesCard,
      label: t("courseAdmin.archived"),
      value: valueOrLoading(archivedCount),
      trend: t("courseAdmin.status"),
      trendPercent: "ARCHIVED",
    },
    {
      id: "reported",
      component: ReportedCoursesCard,
      label: t("courseAdmin.deleted"),
      value: valueOrLoading(deletedCount),
      trend: t("courseAdmin.status"),
      trendPercent: "DELETED",
    },
  ];

  return (
    <section className="courseStatistics" aria-label="Course Statistics">
      <div className="courseStatisticsGrid">
        {courseStatsData.map((statItem) => {
          const StatCard = statItem.component;
          const { id, ...statProps } = statItem;
          return <StatCard key={id} {...statProps} />;
        })}
      </div>
    </section>
  );
};

export default CourseStatistics;
