import "../VoucherCards.css";

const AppliedVoucherCard = ({ title, value, note, icon: Icon, accent }) => {
  return (
    <article className={`voucherCardItem ${accent}`}>
      <div className="voucherCardHeader">
        <div className="voucherCardIcon">
          {Icon ? <Icon size={20} /> : null}
        </div>
        <span className="voucherCardLabel">{title}</span>
      </div>
      <h3 className="voucherCardValue">{value}</h3>
      <p className="voucherCardNote">{note}</p>
    </article>
  );
};

export default AppliedVoucherCard;
