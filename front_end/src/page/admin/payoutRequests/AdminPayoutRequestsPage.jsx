import { Banknote } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getAdminPayoutRequestsApi } from "../../../api/admin/PayoutApi.js";
import "./AdminPayoutRequestsPage.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value) || 0);

const statusLabel = {
  PENDING: "Pending",
  PAID: "Paid",
  REJECTED: "Rejected",
};

const AdminPayoutRequestsPage = () => {
  const { t } = useTranslation();
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [selectedId, setSelectedId] = useState(requestId ? Number(requestId) : null);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    getAdminPayoutRequestsApi()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setRequests(list);
        setSelectedId((currentId) => currentId ?? list?.[0]?.id ?? null);
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Failed to load payout requests.");
      })
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    if (selectedId) {
      navigate(`/learnova/admin/payout-requests/${selectedId}`, { replace: true });
    }
  }, [navigate, selectedId]);

  const selected = requests.find((r) => r.id === selectedId) || null;

  const selectRequest = (id) => {
    setSelectedId(id);
  };

  return (
    <div className="payoutReqPage">
      <header className="payoutReqPageHeader">
        <h1>{t("opsAdmin.payout")}</h1>
        <p>{t("opsAdmin.payoutSubtitle")}</p>
      </header>

      <div className="payoutReqLayout">
        <aside className="payoutReqSidebar">
          {loadingList ? (
            <p className="payoutReqEmptyState">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="payoutReqEmptyState">{t("opsAdmin.noPayout")}</p>
          ) : (
            <ul>
              {requests.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className={`payoutReqListItem ${selectedId === r.id ? "is-active" : ""}`}
                    onClick={() => selectRequest(r.id)}
                  >
                    <div>
                      <strong>{r.teacherName || r.teacherEmail}</strong>
                      <span>{formatCurrency(r.amount)}</span>
                    </div>
                    <span className={`payoutReqStatusBadge payoutReqStatus-${r.status}`}>
                      {statusLabel[r.status] || r.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="payoutReqMain">
          {!selected ? (
            <div className="payoutReqEmptyStateCenter">
              <Banknote size={48} />
              <p>{t("opsAdmin.selectPayout")}</p>
            </div>
          ) : (
            <div className="payoutReqDetail">
              <div className="payoutReqDetailHeader">
                <div>
                  <h2>{selected.teacherName || selected.teacherEmail}</h2>
                  <p>{selected.teacherEmail}</p>
                </div>
                <span className={`payoutReqStatusBadge payoutReqStatus-${selected.status}`}>
                  {statusLabel[selected.status] || selected.status}
                </span>
              </div>

              <div className="payoutReqDetailField">
                <label>Amount</label>
                <p>{formatCurrency(selected.amount)}</p>
              </div>

              <div className="payoutReqDetailField">
                <label>Requested at</label>
                <p>{new Date(selected.createdAt).toLocaleString()}</p>
              </div>

              {selected.notes && (
                <div className="payoutReqDetailField">
                  <label>Automatic payout details</label>
                  <p className="payoutReqMultiline">{selected.notes}</p>
                </div>
              )}

              {selected.status === "REJECTED" && selected.rejectionReason && (
                <div className="payoutReqDetailField">
                  <label>Rejection reason</label>
                  <p className="payoutReqMultiline">{selected.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPayoutRequestsPage;
