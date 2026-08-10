import { Info } from "lucide-react";

const buildPoints = (values, maxValue) => {
  if (!values.length) return "";
  const step = values.length > 1 ? 720 / (values.length - 1) : 720;
  return values
    .map((value, index) => {
      const x = values.length > 1 ? index * step : 720 / 2;
      const y = 230 - (maxValue > 0 ? (value / maxValue) * 220 : 0);
      return `${x},${y}`;
    })
    .join(" ");
};

const LearningPerformancePanel = ({ chartLabels, completions }) => {
  const maxValue = Math.max(...completions, 1);
  const linePoints = buildPoints(completions, maxValue);
  const midValue = Math.round(maxValue * 0.5);
  const axisLabels = midValue > 0 && midValue < maxValue ? [maxValue, midValue, 0] : [maxValue, 0];

  return (
    <section className="teacher-analytics-panel-wrap">
      <header className="teacher-analytics-panel-title">
        <h2>
          Course Completions
          <Info size={15} />
        </h2>
        <span className="teacher-analytics-panel-title__hint">Last 30 days</span>
      </header>

      <article className="teacher-analytics-panel teacher-analytics-performance">
      <div className="teacher-analytics-chart">
        <div className="teacher-analytics-chart__body">
          <div className="teacher-analytics-chart__axis" aria-hidden="true">
            {axisLabels.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
          <div className="teacher-analytics-chart__plot">
            {completions.length === 0 ? (
              <p className="teacher-analytics-empty">No course completions yet in the last 30 days.</p>
            ) : (
              <svg viewBox="0 0 720 230" role="img" aria-label="Course completions chart">
                <defs>
                  <linearGradient id="analyticsCompletionFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`M0,230 L${linePoints} L720,230 Z`} fill="url(#analyticsCompletionFill)" />
                <polyline points={linePoints} className="teacher-analytics-chart__line teacher-analytics-chart__line--completion" />
              </svg>
            )}
            <div className="teacher-analytics-chart__labels" aria-hidden="true">
              {chartLabels.length > 0 && (
                <>
                  <span>{chartLabels[0]}</span>
                  <span>{chartLabels[chartLabels.length - 1]}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      </article>
    </section>
  );
};

export default LearningPerformancePanel;
