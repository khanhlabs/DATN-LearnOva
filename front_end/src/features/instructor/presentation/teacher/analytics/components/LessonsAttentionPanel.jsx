import { Info, TriangleAlert } from "lucide-react";

const LessonsAttentionPanel = ({ items }) => (
  <section className="teacher-analytics-panel-wrap">
    <header className="teacher-analytics-panel-title">
      <h2>
        Lessons Need Attention
        <Info size={15} />
      </h2>
      <button type="button">View all</button>
    </header>

    <article className="teacher-analytics-panel teacher-analytics-attention">
    <div className="teacher-analytics-attention-list">
      {items.length === 0 ? (
        <p className="teacher-analytics-empty">No lessons need attention yet — not enough student activity to tell.</p>
      ) : (
        items.map((item) => (
          <button key={item.title} type="button" className={`teacher-analytics-attention-item teacher-analytics-attention-item--${item.tone}`}>
            <span>
              <TriangleAlert size={19} />
            </span>
            <strong>
              {item.title}
              <small>{item.detail}</small>
            </strong>
            <b>
              {item.value}
              <small>{item.label}</small>
            </b>
            <i aria-hidden="true">›</i>
          </button>
        ))
      )}
    </div>
    </article>
  </section>
);

export default LessonsAttentionPanel;
