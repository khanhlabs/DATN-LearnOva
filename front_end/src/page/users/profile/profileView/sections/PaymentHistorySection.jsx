import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import { useAuth } from "../../../../../hook/UseAuth.jsx";
import { useAxiosPrivate } from "../../../../../hook/UseAxiosPrivate.js";
import {
  downloadPaymentReceiptApi,
  getPaymentHistoryApi,
  getPaymentHistoryDetailApi,
} from "../../../../../api/PaymentHistoryApi.js";
import { toast } from "react-toastify";
import PaymentReceiptModal, {
  PaymentHistoryStatus,
  formatPaymentHistoryDate,
  formatPaymentHistoryVnd,
} from "./PaymentReceiptModal.jsx";
import "./PaymentHistorySection.css";

const STATUS_KEYS = ["ALL", "SUCCESS", "PENDING", "FAILED", "CANCELLED", "REFUNDED"];

const toDateParam = (date) => date.toISOString().slice(0, 10);

const getPeriodParams = (period) => {
  if (period === "ALL") return {};
  const days = { MONTH: 30, THREE_MONTHS: 90, SIX_MONTHS: 180 }[period];
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: toDateParam(from), to: toDateParam(new Date()) };
};

const PaymentHistorySection = () => {
  const { t, i18n } = useTranslation();
  const { accessToken } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [periodFilter, setPeriodFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [history, setHistory] = useState({ content: [], totalElements: 0, totalPages: 0, number: 0 });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");

  const requestParams = useMemo(() => ({
    page,
    size: 10,
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
    ...(searchTerm.trim() ? { search: searchTerm.trim() } : {}),
    ...getPeriodParams(periodFilter),
  }), [page, periodFilter, searchTerm, statusFilter]);

  useEffect(() => {
    if (!accessToken) return undefined;
    let mounted = true;
    setIsLoading(true);
    setError("");

    getPaymentHistoryApi(axiosPrivate, accessToken, requestParams)
      .then((data) => {
        if (mounted) setHistory(data);
      })
      .catch((requestError) => {
        if (mounted) {
          setHistory({ content: [], totalElements: 0, totalPages: 0, number: 0 });
          setError(requestError?.response?.data?.message || t("profile.paymentHistory.loadError"));
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [accessToken, axiosPrivate, requestParams, t]);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(0);
    setSelectedPayment(null);
  };

  const handleOpenDetail = async (orderId) => {
    setIsLoadingDetail(true);
    try {
      setSelectedPayment(await getPaymentHistoryDetailApi(axiosPrivate, orderId, accessToken));
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || t("profile.paymentHistory.detailError"));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!selectedPayment || selectedPayment.orderStatus !== "PAID" || selectedPayment.paymentStatus !== "SUCCESS") return;
    setIsDownloading(true);
    try {
      const blob = await downloadPaymentReceiptApi(axiosPrivate, selectedPayment.orderId, accessToken);
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
      toast.error(requestError?.response?.data?.message || t("profile.paymentHistory.downloadError"));
    } finally {
      setIsDownloading(false);
    }
  };

  const payments = history.content || [];

  return (
    <section className="payment-history-page">
      <header className="payment-history-header">
        <div>
          <span className="payment-history-eyebrow"><CreditCard size={15} /> {t("profile.paymentHistory.eyebrow")}</span>
          <h1>{t("profile.paymentHistory.title")}</h1>
          <p>{t("profile.paymentHistory.description")}</p>
        </div>
        <div className="payment-history-total">
          <span>{t("profile.paymentHistory.totalOrders")}</span>
          <strong>{history.totalElements || 0}</strong>
        </div>
      </header>

      <div className="payment-history-toolbar">
        <label className="payment-search-field">
          <Search size={17} />
          <input value={searchTerm} onChange={(event) => handleFilterChange(setSearchTerm, event.target.value)} placeholder={t("profile.paymentHistory.searchPlaceholder")} aria-label={t("profile.paymentHistory.searchAria")} />
        </label>
        <select value={statusFilter} onChange={(event) => handleFilterChange(setStatusFilter, event.target.value)} aria-label={t("profile.paymentHistory.statusFilterAria")}>
          {STATUS_KEYS.map((value) => <option key={value} value={value}>{t(`profile.paymentHistory.status.${value.toLowerCase()}`)}</option>)}
        </select>
        <select value={periodFilter} onChange={(event) => handleFilterChange(setPeriodFilter, event.target.value)} aria-label={t("profile.paymentHistory.periodFilterAria")}>
          <option value="ALL">{t("profile.paymentHistory.period.all")}</option>
          <option value="MONTH">{t("profile.paymentHistory.period.month")}</option>
          <option value="THREE_MONTHS">{t("profile.paymentHistory.period.threeMonths")}</option>
          <option value="SIX_MONTHS">{t("profile.paymentHistory.period.sixMonths")}</option>
        </select>
      </div>

      <div className="payment-history-table-card">
        <div className="payment-history-table-head">
          <span>{t("profile.paymentHistory.table.order")}</span><span>{t("profile.paymentHistory.table.course")}</span><span>{t("profile.paymentHistory.table.date")}</span><span>{t("profile.paymentHistory.table.amount")}</span><span>{t("profile.paymentHistory.table.status")}</span><span />
        </div>
        {isLoading ? <div className="payment-history-empty"><Loader2 className="payment-history-spinner" size={28} /><span>{t("profile.paymentHistory.loading")}</span></div> : error ? <div className="payment-history-empty"><strong>{error}</strong></div> : payments.length ? payments.map((payment) => (
          <button className="payment-history-row" key={payment.orderId} onClick={() => handleOpenDetail(payment.orderId)} type="button">
            <strong>{payment.transactionId || (payment.paymentId != null ? `PAY-${payment.paymentId}` : `#${payment.orderId}`)}</strong>
            <span className="payment-course-cell"><b>{payment.courseTitles?.[0] || t("profile.paymentHistory.unknownCourse")}</b>{payment.courseTitles?.length > 1 && <small>+{payment.courseTitles.length - 1} {t("profile.paymentHistory.moreCourses")}</small>}</span>
            <span>{formatPaymentHistoryDate(payment.paidAt || payment.createdAt, i18n.language)}</span>
            <span><b>{formatPaymentHistoryVnd(payment.amountVnd, "VND")}</b></span>
            <PaymentHistoryStatus status={payment.paymentStatus || payment.orderStatus} translate={t} />
            <ChevronRight size={18} />
          </button>
        )) : <div className="payment-history-empty"><FileText size={34} /><strong>{t("profile.paymentHistory.emptyTitle")}</strong><span>{t("profile.paymentHistory.emptyDescription")}</span></div>}
      </div>

      {history.totalPages > 1 && <div className="payment-history-pagination">
        <button type="button" disabled={page === 0} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={16} />{t("profile.paymentHistory.previous")}</button>
        <span>{t("profile.paymentHistory.pageOf", { page: page + 1, total: history.totalPages })}</span>
        <button type="button" disabled={page + 1 >= history.totalPages} onClick={() => setPage((current) => current + 1)}>{t("profile.paymentHistory.next")}<ChevronRight size={16} /></button>
      </div>}

      {(isLoadingDetail || selectedPayment) && (
        <PaymentReceiptModal
          payment={selectedPayment}
          isLoading={isLoadingDetail}
          isDownloading={isDownloading}
          onClose={() => setSelectedPayment(null)}
          onDownload={handleDownloadReceipt}
        />
      )}
    </section>
  );
};

export default PaymentHistorySection;
