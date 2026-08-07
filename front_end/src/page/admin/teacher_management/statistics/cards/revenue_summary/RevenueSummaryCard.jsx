import { BadgeDollarSign } from "lucide-react";
import "./RevenueSummaryCard.css";

const RevenueSummaryCard = ({ title, value }) => {
  return (
    <article className="instructorStatCard instructorStatCard--violet">
      <div
        className="instructorStatIconWrap instructorStatIconWrap--violet"
        aria-hidden="true"
      >
        <BadgeDollarSign size={22} />
      </div>

      <div className="instructorStatContent">
        <p className="instructorStatTitle">{title}</p>
        <p className="instructorStatValue">{value}</p>
      </div>
    </article>
  );
};

export default RevenueSummaryCard;
