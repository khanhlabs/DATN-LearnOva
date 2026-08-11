import { CheckCircle } from "lucide-react";
import "./PublishedCoursesCard.css";

const PublishedCoursesCard = ({ label, value, trend, trendPercent }) => {
  return (
    <article className="courseStatCard courseStatCard--published">
      <div className="courseStatHeader">
        <p className="courseStatLabel">{label}</p>
        <div
          className="courseStatIcon courseStatIcon--published"
          aria-hidden="true"
        >
          <CheckCircle size={24} />
        </div>
      </div>

      <p className="courseStatValue">{value}</p>

      <div className="courseStatBar" aria-hidden="true">
        <div className="courseStatBar--fill courseStatBar--published" />
      </div>

      <p className="courseStatTrend courseStatTrend--published">
        <span className="courseStatTrendIcon">↗</span>
        <span className="courseStatTrendText">{trend}</span>
        <span className="courseStatTrendPercent">{trendPercent}</span>
      </p>
    </article>
  );
};

export default PublishedCoursesCard;
