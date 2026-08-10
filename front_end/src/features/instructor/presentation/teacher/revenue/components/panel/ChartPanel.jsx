import { CalendarDays, CreditCard, Wallet } from "lucide-react";
import { buildLinePoints } from "../../utils/revenueChartUtils";
import { formatCompactCurrency } from "../../data/revenuePageData";

const highlightIcons = {
  calendar: CalendarDays,
  "credit-card": CreditCard,
  wallet: Wallet,
};

const MAX_VISIBLE_LABELS = 7;

const pickVisibleLabels = (labels) => {
  if (labels.length <= MAX_VISIBLE_LABELS) return labels;

  const lastIndex = labels.length - 1;
  const step = lastIndex / (MAX_VISIBLE_LABELS - 1);
  const indices = new Set();
  for (let i = 0; i < MAX_VISIBLE_LABELS; i += 1) {
    indices.add(Math.round(i * step));
  }
  return labels.filter((_, index) => indices.has(index));
};

const ChartPanel = ({ chartLabels, currentChart, previousChart, highlights }) => {
  const maxValue = Math.max(...currentChart, ...previousChart, 1);
  const activeLine = buildLinePoints(currentChart, 720, 230, maxValue);
  const previousLine = buildLinePoints(previousChart, 720, 230, maxValue);
  const visibleLabels = pickVisibleLabels(chartLabels);

  return (
    <section className="teacher-revenue-panel-wrap">
      <header className="teacher-revenue-panel-title">
        <h2>Revenue in the last 30 days</h2>
      </header>

      <article className="teacher-revenue-panel teacher-revenue-chart-panel">
      <div className="teacher-revenue-chart-shell">
        <div className="teacher-revenue-y-axis" aria-hidden="true">
          {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
            <span key={ratio}>{ratio === 0 ? "0" : formatCompactCurrency(maxValue * ratio)}</span>
          ))}
        </div>
        <div className="teacher-revenue-chart-area">
          <div className="teacher-revenue-chart-legend">
            <span className="teacher-revenue-chart-legend__solid">Revenue</span>
            <span className="teacher-revenue-chart-legend__dashed">Previous 30 days</span>
          </div>
          <svg viewBox="0 0 720 230" role="img" aria-label="Revenue line chart">
            <defs>
              <linearGradient id="teacherRevenueFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`M0,230 L${activeLine} L720,230 Z`} fill="url(#teacherRevenueFill)" />
            <polyline points={previousLine} fill="none" stroke="#93c5fd" strokeDasharray="7 7" strokeWidth="3" />
            <polyline points={activeLine} fill="none" stroke="#2563eb" strokeWidth="4" />
          </svg>
          <div className="teacher-revenue-x-axis" aria-hidden="true">
            {visibleLabels.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
        </div>
      </div>

      <footer className="teacher-revenue-chart-footer">
        {highlights.map((highlight) => {
          const Icon = highlightIcons[highlight.icon];

          return (
            <div key={highlight.label}>
              <Icon size={18} />
              <span>{highlight.label}</span>
              <strong>{highlight.value}</strong>
              <small>{highlight.note}</small>
            </div>
          );
        })}
      </footer>
      </article>
    </section>
  );
};

export default ChartPanel;
