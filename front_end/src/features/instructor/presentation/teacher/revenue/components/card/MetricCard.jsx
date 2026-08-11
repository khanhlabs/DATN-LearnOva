import { buildLinePoints } from "../../utils/revenueChartUtils";

const Sparkline = ({ values, tone }) => (
  <svg className="teacher-revenue-sparkline" viewBox="0 0 110 54" aria-hidden="true">
    <defs>
      <linearGradient id={`sparkline-${tone}`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
      </linearGradient>
    </defs>
    <path d={`M0,52 L${buildLinePoints(values, 110, 52)} L110,52 Z`} fill={`url(#sparkline-${tone})`} />
    <polyline points={buildLinePoints(values, 110, 52)} fill="none" stroke="currentColor" strokeWidth="2.5" />
  </svg>
);

const MiniBars = ({ values }) => (
  <div className="teacher-revenue-mini-bars" aria-hidden="true">
    {values.map((height, index) => (
      <i key={`${height}-${index}`} style={{ height: `${height}%` }} />
    ))}
  </div>
);

const MetricCard = ({ metric }) => {
  const Icon = metric.icon;

  return (
    <article className={`teacher-revenue-metric teacher-revenue-metric--${metric.tone}`}>
      <div className="teacher-revenue-metric__icon">
        <Icon size={21} />
      </div>
      <div>
        <span>{metric.label}</span>
        <strong>{metric.value}</strong>
        <small>{metric.note}</small>
      </div>
      {metric.bars ? (
        <MiniBars values={metric.bars} />
      ) : metric.sparkline?.length ? (
        <Sparkline values={metric.sparkline} tone={metric.tone} />
      ) : null}
    </article>
  );
};

export default MetricCard;
