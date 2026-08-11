import { AlertTriangle } from "lucide-react";
import "./ReportedCoursesCard.css";

const ReportedCoursesCard = ({ label, value, trend, trendPercent }) => {
  return (
    <article className="courseStatCard courseStatCard--reported">
      <div className="courseStatHeader">
        <p className="courseStatLabel">{label}</p>
        <div
          className="courseStatIcon courseStatIcon--reported"
          aria-hidden="true"
        >
          <AlertTriangle size={24} />
        </div>
      </div>

      <p className="courseStatValue">{value}</p>

      <div className="courseStatBar" aria-hidden="true">
        <div className="courseStatBar--fill courseStatBar--reported" />
      </div>

      <p className="courseStatTrend courseStatTrend--reported">
        <span className="courseStatTrendIcon">↗</span>
        <span className="courseStatTrendText">{trend}</span>
        <span className="courseStatTrendPercent">{trendPercent}</span>
      </p>
    </article>
  );
};

export default ReportedCoursesCard;
