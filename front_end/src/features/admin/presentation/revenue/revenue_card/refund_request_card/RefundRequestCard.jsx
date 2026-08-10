import "./RefundRequestCard";

const RefundRequestCard = ({ title, value, delta, label, icon: Icon, deltaTone = "negative" }) => {
  return (
    <article className="refundRequestCard">
      <header className="refundRequestCardHeader">
        <p className="refundRequestCardTitle">{title}</p>
        {Icon && <Icon className="refundRequestCardIcon" />}
      </header>

      <div className="refundRequestCardBody">
        <p className="refundRequestCardValue">{value}</p>
        <div className="refundRequestCardMeta">
          <span className={`revenueDelta ${deltaTone}`}>{delta}</span>
          <span className="refundRequestCardLabel">{label}</span>
        </div>
      </div>
    </article>
  );
};

export default RefundRequestCard;
