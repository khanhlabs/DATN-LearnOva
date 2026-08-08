import ReportSummaryCard from "./ReportSummaryCard.jsx";
import { reportSummaryCards } from "./reportSummaryData.js";
import "./ReportCards.css";

const ReportCards = () => {
  return (
    <section className="reportCardsSection">
      <div className="reportCardsGrid">
        {reportSummaryCards.map((card) => (
          <ReportSummaryCard
            key={card.id}
            count={card.count}
            icon={card.icon}
            iconClassName={card.iconClassName}
            label={card.label}
            note={card.note}
          />
        ))}
      </div>
    </section>
  );
};

export default ReportCards;
