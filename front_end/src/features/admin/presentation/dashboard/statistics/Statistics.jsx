import {
  BookOpen,
  GraduationCap,
  SquareUserRound,
  CircleDollarSign,
} from "lucide-react";
import "./Statistics.css";
import { useTranslation } from "react-i18next";

const createStatisticsData = (data, loading) => [
  {
    id: "users",
    label: "Total Users",
    value: loading ? "..." : data.totalUsers,
    icon: SquareUserRound,
  },
  {
    id: "teachers",
    label: "Total Teachers",
    value: loading ? "..." : data.totalTeachers,
    icon: GraduationCap,
  },
  {
    id: "courses",
    label: "Total Courses",
    value: loading ? "..." : data.totalCourses,
    icon: BookOpen,
  },
  {
    id: "revenue",
    label: "Total Revenue",
    value: loading ? "..." : data.totalRevenue,
    icon: CircleDollarSign,
  },
];

const Statistics = ({ data, loading = false }) => {
  const { t } = useTranslation();
  const statisticsData = createStatisticsData(data, loading);
  statisticsData.forEach((item) => { item.label = t(`admin.total${item.id[0].toUpperCase()}${item.id.slice(1)}`); });

  return (
    <section className="dashboardStatistics" aria-label="Dashboard statistics">
      {statisticsData.map((item) => {
        const Icon = item.icon;

        return (
          <article key={item.id} className="dashboardStatisticsCard">
            <div className="dashboardStatisticsCardIcon">
              <Icon size={24} strokeWidth={2.2} aria-hidden="true" />
            </div>

            <div className="dashboardStatisticsCardBody">
              <div className="dashboardStatisticsCardHeader">
                <h3 className="dashboardStatisticsCardLabel">{item.label}</h3>
              </div>

              <div className="dashboardStatisticsCardValue">{item.value}</div>
            </div>
          </article>
        );
      })}
    </section>
  );
};

export default Statistics;
