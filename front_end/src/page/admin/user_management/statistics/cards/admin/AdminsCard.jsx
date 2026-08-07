import { Shield } from "lucide-react";
import "../../UserManagementStats.css";

const AdminsCard = ({ title, value, trend, trendTone }) => {
  return (
    <article className="userManagementStatCard">
      <div
        className="userManagementStatIcon userManagementStatIcon--amber"
        aria-hidden="true"
      >
        <Shield />
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

export default AdminsCard;
