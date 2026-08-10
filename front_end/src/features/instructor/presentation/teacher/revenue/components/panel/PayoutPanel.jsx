import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { TrendingUp, Wallet } from "lucide-react";
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
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshPayoutData = async () => {
    try {
      const [balanceData, historyData] = await Promise.all([
        getPayoutBalance(),
        getMyPayoutHistory(),
      ]);
      setBalance(balanceData);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch {
      // fail silently - panel still shows lifetime/30-day figures
    }
  };

  useEffect(() => {
    getPayoutBalance().then(setBalance).catch(() => {});
    getMyPayoutHistory()
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const openModal = () => {
    setAmount("");
    setNotes("");
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (balance && numericAmount > balance.availableBalance) {
      toast.error("Requested amount exceeds your available balance.");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPayout({ amount: numericAmount, notes: notes.trim() || null });
      toast.success("Payout request submitted.");
      setShowModal(false);
      await refreshPayoutData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit payout request.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <button type="button" className="teacher-payout-request-btn" onClick={openModal}>
          Request Payout
        </button>

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

      {showModal && (
        <div className="teacher-payout-modal-overlay" onClick={() => !isSubmitting && setShowModal(false)}>
          <form
            className="teacher-payout-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <h3>Request Payout</h3>
            {balance && (
              <p className="teacher-payout-modal-balance">
                Available balance: <strong>{formatCurrency(balance.availableBalance)}</strong>
              </p>
            )}

            <label>
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>

            <label>
              Notes (optional)
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Bank transfer details or preferred payment method"
              />
            </label>

            <div className="teacher-payout-modal-actions">
              <button type="button" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="teacher-payout-submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit request"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

export default PayoutPanel;
