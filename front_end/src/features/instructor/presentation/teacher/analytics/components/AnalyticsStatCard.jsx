const AnalyticsStatCard = ({ item }) => {
  const Icon = item.icon;

  return (
    <article className={`teacher-analytics-stat teacher-analytics-stat--${item.tone}`}>
      <span className="teacher-analytics-stat__icon">
        <Icon size={23} />
      </span>
      <div>
        <small>{item.label}</small>
        <strong>{item.value}</strong>
        <p>{item.compare}</p>
      </div>
    </article>
  );
};

export default AnalyticsStatCard;
