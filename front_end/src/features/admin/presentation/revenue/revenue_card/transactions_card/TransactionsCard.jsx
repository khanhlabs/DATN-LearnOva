import "./TransactionsCard.css";

const TransactionsCard = ({ title, value, delta, subtitle, icon: Icon }) => {
  return (
    <article className="transactionsCard">
      <header className="transactionsCardHeader">
        <p className="transactionsCardTitle">{title}</p>
        {Icon && <Icon className="transactionsCardIcon" />}
      </header>

      <div className="transactionsCardBody">
        <p className="transactionsCardValue">{value}</p>
        <div className="transactionsCardMeta">
          <span className="revenueDelta positive">{delta}</span>
          <span className="transactionsCardSubtitle">{subtitle}</span>
        </div>
      </div>
    </article>
  );
};

export default TransactionsCard;
