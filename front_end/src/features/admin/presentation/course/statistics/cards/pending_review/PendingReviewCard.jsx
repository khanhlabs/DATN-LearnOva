import { Clock } from "lucide-react";
import "./PendingReviewCard.css";

const PendingReviewCard = ({ label, value, trend, trendPercent }) => {
  return (
    <article className="courseStatCard courseStatCard--pending">
      <div className="courseStatHeader">
        <p className="courseStatLabel">{label}</p>
        <div
          className="courseStatIcon courseStatIcon--pending"
          aria-hidden="true"
        >
          <Clock size={24} />
        </div>
      </div>

      <p className="courseStatValue">{value}</p>

      <div className="courseStatBar" aria-hidden="true">
        <div className="courseStatBar--fill courseStatBar--pending" />
      </div>

      <p className="courseStatTrend courseStatTrend--pending">
        <span className="courseStatTrendIcon">↗</span>
        <span className="courseStatTrendText">{trend}</span>
        <span className="courseStatTrendPercent">{trendPercent}</span>
      </p>
    </article>
  );
};

export default PendingReviewCard;
