import { BookOpen } from "lucide-react";
import "../../UserManagementStats.css";

const TeachersCard = ({ title, value, trend, trendTone }) => {
  return (
    <article className="userManagementStatCard">
      <div
        className="userManagementStatIcon userManagementStatIcon--orange"
        aria-hidden="true"
      >
        <BookOpen />
      </div>

      <div className="userManagementStatContent">
        <p className="userManagementStatTitle">{title}</p>
        <div className="userManagementStatValue">{value}</div>
        <p
          className={`userManagementStatTrend userManagementStatTrend--${trendTone}`}
        >
          {trend}
        </p>
      </div>
    </article>
  );
};

export default TeachersCard;
