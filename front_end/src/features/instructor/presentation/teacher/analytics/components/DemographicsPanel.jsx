import { PieChart } from "lucide-react";
import AnalyticsPanelHeader from "./AnalyticsPanelHeader";

const DemographicsPanel = ({ demographicItems, title = "Student demographics" }) => (
  <article className="teacher-analytics-panel teacher-analytics-panel--demographics">
    <AnalyticsPanelHeader icon={PieChart} iconTone="gold" title={title} />

    {demographicItems.length === 0 ? (
      <p className="teacher-analytics-empty">No student data yet.</p>
    ) : (
      <>
        <div className="teacher-analytics-demographic-bar" role="img" aria-label={`${title} breakdown`}>
          {demographicItems.map((item) => (
            <span
              key={item.label}
              className="teacher-analytics-demographic-bar__segment"
              style={{ width: `${item.value}%`, background: item.color }}
              title={`${item.label}: ${item.value}%`}
            />
          ))}
        </div>

        <div className="teacher-analytics-demographic-list">
          {demographicItems.map((item) => (
            <div key={item.label} className="teacher-analytics-demographic-item">
              <i aria-hidden="true" style={{ background: item.color }} />
              <strong>{item.label}</strong>
              <span>{item.value}%</span>
            </div>
          ))}
        </div>
      </>
    )}
  </article>
);

export default DemographicsPanel;
