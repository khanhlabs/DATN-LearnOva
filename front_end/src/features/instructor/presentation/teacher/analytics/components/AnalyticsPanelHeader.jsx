const AnalyticsPanelHeader = ({ icon: Icon, iconTone, title }) => {
  return (
    <header>
      <span className={`teacher-analytics-panel__icon teacher-analytics-panel__icon--${iconTone}`}>
        <Icon size={28} />
      </span>
      <h2>{title}</h2>
    </header>
  );
};

export default AnalyticsPanelHeader;
