import { createElement } from "react";
import GraduationRateChart from "./graduation_rate_chart/GraduationRateChart";
import StudyProgressChart from "./study_progress_chart/StudyProgressChart";
import EngagementChart from "./engagement_chart/EngagementChart";
import "./Learning.css";

const charts = [
  { id: "graduation", component: GraduationRateChart },
  { id: "progress", component: StudyProgressChart },
  { id: "engagement", component: EngagementChart },
];

const Learning = () => {
  return (
    <div className="learningTabContent">
      <div className="learningChartsGrid">
        {charts.map(({ id, component: ChartComponent }) => (
          createElement(ChartComponent, { key: id })
        ))}
      </div>
    </div>
  );
};

export default Learning;
