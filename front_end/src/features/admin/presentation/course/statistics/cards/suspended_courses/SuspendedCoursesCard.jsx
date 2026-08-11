import { Ban } from "lucide-react";
import "./SuspendedCoursesCard.css";

const SuspendedCoursesCard = ({ label, value, trend, trendPercent }) => {
  return (
    <article className="courseStatCard courseStatCard--suspended">
      <div className="courseStatHeader">
        <p className="courseStatLabel">{label}</p>
        <div
          className="courseStatIcon courseStatIcon--suspended"
          aria-hidden="true"
        >
          <Ban size={24} />
        </div>
      </div>

      <p className="courseStatValue">{value}</p>

      <div className="courseStatBar" aria-hidden="true">
        <div className="courseStatBar--fill courseStatBar--suspended" />
      </div>

      <p className="courseStatTrend courseStatTrend--suspended">
        <span className="courseStatTrendIcon">↙</span>
        <span className="courseStatTrendText">{trend}</span>
        <span className="courseStatTrendPercent">{trendPercent}</span>
      </p>
    </article>
  );
};

export default SuspendedCoursesCard;
