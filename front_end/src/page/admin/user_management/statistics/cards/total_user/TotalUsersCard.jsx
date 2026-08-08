import { Users } from "lucide-react";
import "../../UserManagementStats.css";

const TotalUsersCard = ({ title, value, trend, trendTone }) => {
  return (
    <article className="userManagementStatCard">
      <div
        className="userManagementStatIcon userManagementStatIcon--blue"
        aria-hidden="true"
      >
        <Users />
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

export default TotalUsersCard;
