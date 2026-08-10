import ReportSummaryCard from "./ReportSummaryCard";
import { reportSummaryCards } from "./reportSummaryData";
import "./ReportCards";

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
