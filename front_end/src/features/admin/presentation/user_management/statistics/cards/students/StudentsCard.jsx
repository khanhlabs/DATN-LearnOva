import { GraduationCap } from "lucide-react";
import "../../UserManagementStats.css";

const StudentsCard = ({ title, value, trend, trendTone }) => {
  return (
    <article className="userManagementStatCard">
      <div
        className="userManagementStatIcon userManagementStatIcon--green"
        aria-hidden="true"
      >
        <GraduationCap />
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

export default StudentsCard;
