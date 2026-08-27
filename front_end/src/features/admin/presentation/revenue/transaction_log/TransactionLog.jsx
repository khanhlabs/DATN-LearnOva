import { useEffect, useMemo, useState } from "react";
import { Search, FileText } from "lucide-react";
import { toast } from "react-toastify";
import AdminHoverSelect from "../../shared/AdminHoverSelect";
import { getAdminCategoriesApi } from "../../../infrastructure/api/CategoryApi";
import { getAdminRevenueTransactionsApi } from "../../../infrastructure/api/RevenueApi";
import {
  downloadPaymentReceiptApi,
  getPaymentHistoryDetailApi,
} from "../../../../profile/infrastructure/api/PaymentHistoryApi";
import PaymentReceiptModal from "../../../../profile/presentation/profileView/sections/PaymentReceiptModal";
import { useAuth } from "../../../../../shared/hooks/useAuth";
import { useAxiosPrivate } from "../../../../../shared/hooks/useAxiosPrivate";
import "./TransactionLog.css";
import { useTranslation } from "react-i18next";

const statusClasses = {
  Successful: "statusSuccess",
  Pending: "statusPending",
  Failed: "statusFailed",
  Refunded: "statusRefunded",
};

const PAGE_SIZE = 7;

const formatMoney = (value) =>
  `$ ${Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`;

const formatGateway = (method) => {
  if (!method) return "—";
  const map = {
    VNPAY: "VNPay",
    MOMO: "Momo",
    PAYOS: "PayOS",
    PAYPAL: "PayPal",
  };
  return map[method] || method;
};

const TransactionLog = () => {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedGateway, setSelectedGateway] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedDisplayCode, setSelectedDisplayCode] = useState("");
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const gatewayOptions = useMemo(
    () => [
      { value: "ALL", label: t("revenueDetails.allGateways") },
      { value: "VNPAY", label: "VNPay" },
      { value: "MOMO", label: "Momo" },
      { value: "PAYOS", label: "PayOS" },
      { value: "PAYPAL", label: "PayPal" },
    ],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      { value: "ALL", label: t("revenueDetails.allStatuses") },
      { value: "SUCCESS", label: t("revenueDetails.statusSuccessful") },
      { value: "PENDING", label: t("revenueDetails.statusPending") },
      { value: "FAILED", label: t("revenueDetails.statusFailed") },
      { value: "REFUNDED", label: t("revenueDetails.statusRefunded") },
    ],
    [t]
  );

  const statusLabel = (status) => {
    const map = {
      Successful: t("revenueDetails.statusSuccessful"),
      Pending: t("revenueDetails.statusPending"),
      Failed: t("revenueDetails.statusFailed"),
      Refunded: t("revenueDetails.statusRefunded"),
    };
    return map[status] || status || "—";
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      try {
        const data = await getAdminCategoriesApi(axiosPrivate);
        if (!mounted) return;
        setCategories(Array.isArray(data) ? data.filter((item) => !item.isDeleted) : []);
      } catch {
        if (!mounted) return;
        setCategories([]);
      }
    };

    loadCategories();
    return () => {
      mounted = false;
    };
  }, [axiosPrivate]);

  useEffect(() => {
    let mounted = true;

    const loadTransactions = async () => {
      setLoading(true);
      try {
        const data = await getAdminRevenueTransactionsApi(
          {
            page: currentPage - 1,
            size: PAGE_SIZE,
            search,
            categoryId: selectedCategory === "ALL" ? undefined : Number(selectedCategory),
            paymentMethod: selectedGateway === "ALL" ? undefined : selectedGateway,
            status: selectedStatus === "ALL" ? undefined : selectedStatus,
          },
          axiosPrivate
        );
        if (!mounted) return;
        setTransactions(Array.isArray(data?.content) ? data.content : []);
        setTotalPages(Number(data?.totalPages || 0));
        setError("");
      } catch {
        if (!mounted) return;
        setTransactions([]);
        setTotalPages(0);
        setError(t("revenueDetails.transactionsLoadError"));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadTransactions();
    return () => {
      mounted = false;
    };
  }, [
    axiosPrivate,
    currentPage,
    search,
    selectedCategory,
    selectedGateway,
    selectedStatus,
    t,
  ]);

  const categoryOptions = useMemo(
    () => [
      { value: "ALL", label: t("revenueDetails.allCategories") },
      ...categories.map((category) => ({
        value: String(category.id),
        label: category.name,
      })),
    ],
    [categories, t]
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) {
      return;
    }
    setCurrentPage(page);
  };

  const handleFilterChange = (setter) => (value) => {
    setter(value);
    setCurrentPage(1);
  };

  const closeReceipt = () => {
    setSelectedPayment(null);
    setSelectedDisplayCode("");
  };

  const handleOpenDetail = async (transaction) => {
    if (!transaction?.orderId) return;
    setIsLoadingDetail(true);
    setSelectedPayment(null);
    setSelectedDisplayCode(transaction.transactionId || `PAY-${transaction.paymentId}`);
    try {
      setSelectedPayment(
        await getPaymentHistoryDetailApi(axiosPrivate, transaction.orderId, accessToken)
      );
    } catch (requestError) {
      setSelectedDisplayCode("");
      toast.error(
        requestError?.response?.data?.message || t("profile.paymentHistory.detailError")
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (
      !selectedPayment ||
      selectedPayment.orderStatus !== "PAID" ||
      selectedPayment.paymentStatus !== "SUCCESS"
    ) {
      return;
    }
    setIsDownloading(true);
    try {
      const blob = await downloadPaymentReceiptApi(
        axiosPrivate,
        selectedPayment.orderId,
        accessToken
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `learnova-payment-receipt-${selectedPayment.orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(t("profile.paymentHistory.downloadSuccess"));
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message || t("profile.paymentHistory.downloadError")
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section
      className="transactionLogSection"
      aria-label="Revenue transaction log"
    >
      <div className="transactionLogHeader">
        <div>
          <h2 className="transactionLogTitle">{t("revenueDetails.log")}</h2>
          <p className="transactionLogSubtitle">
            {t("revenueDetails.logDesc")}
          </p>
        </div>
      </div>

      <div className="transactionLogCard">
        <div className="transactionLogControls">
          <label className="transactionSearch">
            <Search size={16} />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("revenueDetails.search")}
            />
          </label>
          <div className="transactionFilters">
            <AdminHoverSelect
              className="transactionFilterSelect"
              options={categoryOptions}
              value={selectedCategory}
              onChange={handleFilterChange(setSelectedCategory)}
              ariaLabel={t("revenueDetails.allCategories")}
            />
            <AdminHoverSelect
              className="transactionFilterSelect transactionFilterSelectWide"
              options={gatewayOptions}
              value={selectedGateway}
              onChange={handleFilterChange(setSelectedGateway)}
              ariaLabel={t("revenueDetails.allGateways")}
            />
            <AdminHoverSelect
              className="transactionFilterSelect"
              options={statusOptions}
              value={selectedStatus}
              onChange={handleFilterChange(setSelectedStatus)}
              ariaLabel={t("revenueDetails.allStatuses")}
            />
          </div>
        </div>

        {error ? <p className="transactionLogError">{error}</p> : null}

        <div className="transactionLogTableWrapper">
          <table className="transactionLogTable">
            <thead>
              <tr>
                <th>{t("revenueDetails.transactionId")}</th><th>{t("revenueDetails.student")}</th><th>{t("revenueDetails.courseName")}</th><th>{t("revenueDetails.gateway")}</th><th>{t("revenueDetails.value")}</th><th>{t("revenueDetails.status")}</th><th>{t("revenueDetails.action")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="transactionLogEmpty">
                    {t("revenueDetails.loadingTransactions")}
                  </td>
                </tr>
              ) : null}
              {!loading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="transactionLogEmpty">
                    {t("revenueDetails.noTransactions")}
                  </td>
                </tr>
              ) : null}
              {transactions.map((transaction) => (
                <tr key={`${transaction.orderItemId}-${transaction.paymentId}`}>
                  <td>{transaction.transactionId}</td>
                  <td>{transaction.studentName || "—"}</td>
                  <td>{transaction.courseName}</td>
                  <td>{formatGateway(transaction.paymentMethod)}</td>
                  <td className="textRight">{formatMoney(transaction.amount)}</td>
                  <td>
                    <span
                      className={`transactionStatus ${statusClasses[transaction.status] || ""}`}
                    >
                      {statusLabel(transaction.status)}
                    </span>
                  </td>
                  <td className="textCenter">
                    <button
                      type="button"
                      className="transactionActionButton"
                      aria-label={`View invoice ${transaction.transactionId}`}
                      title={transaction.transactionId}
                      disabled={isLoadingDetail}
                      onClick={() => handleOpenDetail(transaction)}
                    >
                      <FileText size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="transactionLogPagination">
            <button
              type="button"
              className="paginationButton"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              {t("revenueDetails.previous")}
            </button>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                type="button"
                className={`paginationButton ${
                  currentPage === index + 1 ? "active" : ""
                }`}
                onClick={() => handlePageChange(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button
              type="button"
              className="paginationButton"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              {t("revenueDetails.next")}
            </button>
          </div>
        ) : null}
      </div>

      {(isLoadingDetail || selectedPayment) && (
        <PaymentReceiptModal
          payment={selectedPayment}
          isLoading={isLoadingDetail}
          isDownloading={isDownloading}
          displayCode={selectedDisplayCode}
          showStudent
          onClose={closeReceipt}
          onDownload={handleDownloadReceipt}
        />
      )}
    </section>
  );
};

export default TransactionLog;
