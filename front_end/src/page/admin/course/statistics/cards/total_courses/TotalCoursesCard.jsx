import { BookOpen } from "lucide-react";
import "./TotalCoursesCard.css";

const TotalCoursesCard = ({ label, value, trend, trendPercent }) => {
  return (
    <article className="courseStatCard courseStatCard--total">
      <div className="courseStatHeader">
        <p className="courseStatLabel">{label}</p>
        <div
          className="courseStatIcon courseStatIcon--total"
          aria-hidden="true"
        >
          <BookOpen size={24} />
        </div>
      </div>

      <p className="courseStatValue">{value}</p>

      <div className="courseStatBar" aria-hidden="true">
        <div className="courseStatBar--fill courseStatBar--total" />
      </div>

      <p className="courseStatTrend">
        <span className="courseStatTrendIcon">↗</span>
        <span className="courseStatTrendText">{trend}</span>
        <span className="courseStatTrendPercent">{trendPercent}</span>
      </p>
    </article>
  );
};

export default TotalCoursesCard;
