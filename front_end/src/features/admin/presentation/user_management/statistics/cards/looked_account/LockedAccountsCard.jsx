import { LockKeyhole } from "lucide-react";
import "../../UserManagementStats.css";

const LockedAccountsCard = ({ title, value, trend, trendTone }) => {
  return (
    <article className="userManagementStatCard">
      <div
        className="userManagementStatIcon userManagementStatIcon--red"
        aria-hidden="true"
      >
        <LockKeyhole />
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

export default LockedAccountsCard;
