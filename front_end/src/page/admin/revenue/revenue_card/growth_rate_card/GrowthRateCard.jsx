import "./GrowthRateCard.css";

const GrowthRateCard = ({ title, value, detail, icon: Icon }) => {
  return (
    <article className="growthRateCard">
      <header className="growthRateCardHeader">
        <p className="growthRateCardTitle">{title}</p>
        {Icon && <Icon className="growthRateCardIcon" />}
      </header>

      <div className="growthRateCardBody">
        <p className="growthRateCardValue">{value}</p>
        <p className="growthRateCardDetail">{detail}</p>
      </div>
    </article>
  );
};

export default GrowthRateCard;
