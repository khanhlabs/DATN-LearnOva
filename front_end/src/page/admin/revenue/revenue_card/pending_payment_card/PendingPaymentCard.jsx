import "./PendingPaymentCard.css";

const PendingPaymentCard = ({ title, value, note, icon: Icon }) => {
  return (
    <article className="pendingPaymentCard">
      <header className="pendingPaymentCardHeader">
        <p className="pendingPaymentCardTitle">{title}</p>
        {Icon && <Icon className="pendingPaymentCardIcon" />}
      </header>

      <div className="pendingPaymentCardBody">
        <p className="pendingPaymentCardValue">{value}</p>
        <p className="pendingPaymentCardNote">{note}</p>
      </div>
    </article>
  );
};

export default PendingPaymentCard;
