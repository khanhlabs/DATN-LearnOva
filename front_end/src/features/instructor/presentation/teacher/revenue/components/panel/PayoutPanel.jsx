import { useEffect, useState } from "react";
import { TrendingUp, Wallet } from "lucide-react";
// import { formatCurrency } from "../revenuePageData.js";
// import { getPayoutBalance, getMyPayoutHistory } from "../../../../api/teacher/PayoutApi.js";
import { formatCurrency } from "../../data/revenuePageData";
import { getPayoutBalance, getMyPayoutHistory, requestPayout } from "../../../../../infrastructure/api/teacher/PayoutApi";

const statusLabel = {
  PENDING: "Pending",
  PAID: "Paid",
  REJECTED: "Rejected",
};

const PayoutPanel = ({ lifetimeRevenue, revenueTotal }) => {
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getPayoutBalance().then(setBalance).catch(() => {});
    getMyPayoutHistory()
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  return (
    <section className="teacher-revenue-panel-wrap">
      <header className="teacher-revenue-panel-title">
        <h2>Earnings summary</h2>
      </header>

      <div className="teacher-revenue-payout-card">
        <div>
          <span>Lifetime earnings</span>
          <strong>{formatCurrency(lifetimeRevenue)}</strong>
        </div>
        <div>
          <span>Last 30 days</span>
          <strong>{formatCurrency(revenueTotal)}</strong>
        </div>
        {balance && (
          <div>
            <span>Available for payout</span>
            <strong>{formatCurrency(balance.availableBalance)}</strong>
          </div>
        )}

        <div className="teacher-revenue-payout-visual" aria-hidden="true">
          <Wallet size={58} />
          <TrendingUp size={34} />
        </div>
      </div>

      {history.length > 0 && (
        <div className="teacher-payout-history">
          <h3>Payout history</h3>
          {history.map((item) => (
            <div key={item.id} className="teacher-payout-history-item">
              <div>
                <strong>{formatCurrency(item.amount)}</strong>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <span className={`teacher-payout-status teacher-payout-status-${item.status}`}>
                {statusLabel[item.status] || item.status}
              </span>
              {item.status === "REJECTED" && item.rejectionReason && (
                <p className="teacher-payout-rejection-reason">{item.rejectionReason}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default PayoutPanel;
