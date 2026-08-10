import { Info } from "lucide-react";

const StudentEngagementPanel = ({ items }) => (
  <section className="teacher-analytics-panel-wrap">
    <header className="teacher-analytics-panel-title">
      <h2>
        Student Engagement
        <Info size={15} />
      </h2>
    </header>

    <article className="teacher-analytics-panel teacher-analytics-engagement">
    <div className="teacher-analytics-engagement-list">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.label} className={`teacher-analytics-engagement-item teacher-analytics-engagement-item--${item.tone}`}>
            <span>
              <Icon size={20} />
            </span>
            <strong>{item.label}</strong>
            <p>
              <i style={{ width: `${item.progress}%` }} />
            </p>
            <b>{item.value}</b>
            <small>{item.note}</small>
          </div>
        );
      })}
    </div>
    </article>
  </section>
);

export default StudentEngagementPanel;
