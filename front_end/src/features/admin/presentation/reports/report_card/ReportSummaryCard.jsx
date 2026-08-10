import { createElement } from "react";

const ReportSummaryCard = ({ count, icon: Icon, iconClassName, label, note }) => {
  return (
    <div className="reportCard">
      <div className="reportCardHeader">
        <div className={`reportCardIcon ${iconClassName}`}>
          {createElement(Icon, { size: 18 })}
        </div>
        <span className="reportCardLabel">{label}</span>
      </div>
      <div className="reportCardValue">{count}</div>
      <div className="reportCardNote">{note}</div>
    </div>
  );
};

export default ReportSummaryCard;
