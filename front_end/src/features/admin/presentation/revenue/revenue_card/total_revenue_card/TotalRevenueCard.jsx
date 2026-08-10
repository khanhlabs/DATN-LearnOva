import "./TotalRevenueCard";

const TotalRevenueCard = ({ title, value, delta, subtitle, icon: Icon }) => {
  const deltaTone =
    typeof delta === "string" && delta.trim().startsWith("-")
      ? "negative"
      : "positive";

  return (
    <article className="totalRevenueCard">
      <header className="totalRevenueCardHeader">
        <p className="totalRevenueCardTitle">{title}</p>
        {Icon && <Icon className="totalRevenueCardIcon" />}
      </header>

      <div className="totalRevenueCardBody">
        <p className="totalRevenueCardValue">{value}</p>
        <div className="totalRevenueCardMeta">
          <span className={`revenueDelta ${deltaTone}`}>{delta}</span>
          <span className="totalRevenueCardSubtitle">{subtitle}</span>
        </div>
      </div>
    </article>
  );
};

export default TotalRevenueCard;
