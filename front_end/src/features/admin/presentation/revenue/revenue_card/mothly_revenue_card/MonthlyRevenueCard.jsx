import "./MonthlyRevenueCard.css";

const MonthlyRevenueCard = ({ title, value, delta, subtitle, icon: Icon }) => {
  return (
    <article className="monthlyRevenueCard">
      <header className="monthlyRevenueCardHeader">
        <p className="monthlyRevenueCardTitle">{title}</p>
        {Icon && <Icon className="monthlyRevenueCardIcon" />}
      </header>

      <div className="monthlyRevenueCardBody">
        <p className="monthlyRevenueCardValue">{value}</p>
        <div className="monthlyRevenueCardFooter">
          <span className="revenueDelta positive">{delta}</span>
          <span className="monthlyRevenueCardSubtitle">{subtitle}</span>
        </div>
      </div>
    </article>
  );
};

export default MonthlyRevenueCard;
