import { Download, FileText, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./PaymentHistorySection.css";

export const formatPaymentHistoryDate = (value, language) =>
  value
    ? new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "—";

export const formatPaymentHistoryVnd = (value, currency = "VND") =>
  value === null || value === undefined
    ? "—"
    : `${new Intl.NumberFormat("vi-VN").format(value)} ${currency}`;

export const PaymentHistoryStatus = ({ status, translate }) => {
  const normalizedStatus = status?.toLowerCase() || "pending";
  return (
    <span className={`payment-status payment-status--${normalizedStatus}`}>
      {translate(`profile.paymentHistory.status.${normalizedStatus}`)}
    </span>
  );
};

/**
 * Shared invoice/receipt preview modal used by user PaymentHistorySection and admin TransactionLog.
 */
const PaymentReceiptModal = ({
  payment,
  isLoading = false,
  isDownloading = false,
  displayCode,
  showStudent = false,
  onClose,
  onDownload,
}) => {
  const { t, i18n } = useTranslation();

  if (!isLoading && !payment) {
    return null;
  }

  const isReceiptAvailable =
    payment?.orderStatus === "PAID" && payment?.paymentStatus === "SUCCESS";
  const paymentCode =
    displayCode ||
    payment?.transactionId ||
    (payment?.paymentId != null ? `PAY-${payment.paymentId}` : "");
  const titleCode = paymentCode || (payment?.orderId != null ? `#${payment.orderId}` : "");

  return (
    <div
      className="payment-detail-backdrop"
      role="presentation"
      onClick={() => !isLoading && onClose?.()}
    >
      {isLoading ? (
        <div className="payment-detail-loading">
          <Loader2 className="payment-history-spinner" size={30} />
        </div>
      ) : (
        <article
          className="payment-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-label={t("profile.paymentHistory.detail.ariaLabel")}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            className="payment-detail-close"
            onClick={onClose}
            type="button"
            aria-label={t("profile.paymentHistory.detail.close")}
          >
            <X size={20} />
          </button>
          <div className="payment-detail-title">
            <span className="payment-detail-icon">
              <FileText size={20} />
            </span>
            <div>
              <span>{t("profile.paymentHistory.receipt")}</span>
              <h2>{titleCode}</h2>
            </div>
            <PaymentHistoryStatus
              status={payment.paymentStatus || payment.orderStatus}
              translate={t}
            />
          </div>
          <div className="payment-detail-grid">
            <div>
              <span>{t("profile.paymentHistory.detail.orderDate")}</span>
              <strong>{formatPaymentHistoryDate(payment.createdAt, i18n.language)}</strong>
            </div>
            <div>
              <span>{t("profile.paymentHistory.detail.paidDate")}</span>
              <strong>{formatPaymentHistoryDate(payment.paidAt, i18n.language)}</strong>
            </div>
            <div>
              <span>{t("profile.paymentHistory.detail.paymentMethod")}</span>
              <strong>{payment.paymentMethod || "—"}</strong>
            </div>
            <div>
              <span>{t("profile.paymentHistory.detail.transactionId")}</span>
              <strong>{paymentCode || "—"}</strong>
            </div>
          </div>
          {showStudent && (payment.fullName || payment.email) ? (
            <div className="payment-detail-courses">
              <h3>{t("revenueDetails.student")}</h3>
              <div>
                <span>
                  {payment.fullName || "—"}
                  {payment.email ? `  |  ${payment.email}` : ""}
                </span>
              </div>
            </div>
          ) : null}
          <div className="payment-detail-courses">
            <h3>{t("profile.paymentHistory.detail.purchasedCourses")}</h3>
            {(payment.items || []).map((item) => (
              <div key={item.courseId}>
                <span>{item.courseTitle}</span>
              </div>
            ))}
          </div>
          <div className="payment-detail-summary">
            <div className="payment-detail-total">
              <span>{t("profile.paymentHistory.detail.totalVnd")}</span>
              <strong>{formatPaymentHistoryVnd(payment.amountVnd, "VND")}</strong>
            </div>
          </div>
          <button
            className="payment-invoice-button"
            type="button"
            disabled={!isReceiptAvailable || isDownloading}
            onClick={onDownload}
          >
            <Download size={17} />
            {isDownloading
              ? t("profile.paymentHistory.downloading")
              : isReceiptAvailable
                ? t("profile.paymentHistory.downloadReceipt")
                : t("profile.paymentHistory.receiptUnavailable")}
          </button>
        </article>
      )}
    </div>
  );
};

export default PaymentReceiptModal;
