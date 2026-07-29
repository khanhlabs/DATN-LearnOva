import { ExternalLink, Loader2, QrCode, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { getPaymentStatusApi } from "../../api/PaymentApi.js";
import { useAuth } from "../../hook/UseAuth.jsx";
import { useAxiosPrivate } from "../../hook/UseAxiosPrivate.js";
import "./PaymentModal.css";

const formatUsd = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));

const formatVnd = (value) =>
  `${Math.round(Number(value || 0)).toLocaleString("vi-VN")}đ`;

/** PayOS returns VietQR text (starts with 000201). Do not turn checkoutUrl into a QR. */
function buildQrSource(payment) {
  const raw = payment?.qrCode ? String(payment.qrCode).trim() : "";
  if (!raw) return null;
  if (raw.startsWith("http") || raw.startsWith("data:image")) {
    return { kind: "image", data: raw };
  }
  return { kind: "text", data: raw };
}

const PaymentModal = ({ payment, onClose, onPaid }) => {
  const axiosPrivate = useAxiosPrivate();
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState(payment);
  const [pollError, setPollError] = useState("");
  const [qrImageSrc, setQrImageSrc] = useState("");
  const [qrError, setQrError] = useState("");
  const doneRef = useRef(false);

  // Draw QR once when payment is created
  useEffect(() => {
    let alive = true;
    const source = buildQrSource(payment);

    setQrImageSrc("");
    setQrError("");

    if (!source) {
      setQrError("No VietQR. Use Open payOS below.");
      return undefined;
    }

    if (source.kind === "image") {
      setQrImageSrc(source.data);
      return undefined;
    }

    QRCode.toDataURL(source.data, {
      errorCorrectionLevel: "M",
      margin: 4,
      width: 480,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => {
        if (alive) setQrImageSrc(url);
      })
      .catch(() => {
        if (alive) setQrError("Could not draw QR.");
      });

    return () => {
      alive = false;
    };
  }, [payment]);

  // Poll PayOS status every 2s (covers local when webhook cannot reach localhost)
  useEffect(() => {
    if (!payment?.orderId) return undefined;

    setStatus(payment);
    setPollError("");
    doneRef.current = false;

    const checkPaid = async () => {
      try {
        const next = await getPaymentStatusApi(axiosPrivate, payment.orderId, accessToken);
        setStatus((prev) => ({ ...prev, ...next }));
        setPollError("");

        const paid = next.orderStatus === "PAID" || next.paymentStatus === "SUCCESS";
        if (!doneRef.current && paid) {
          doneRef.current = true;
          onPaid?.(next);
          window.setTimeout(() => {
            onClose?.();
            navigate("/learnova/user/profile/courses");
          }, 1200);
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          setPollError("Session expired. Sign in again to confirm payment.");
          return;
        }
        setPollError(err?.response?.data?.message || "Could not check payment status.");
      }
    };

    const timer = window.setInterval(checkPaid, 2000);
    checkPaid();

    const onShow = () => {
      if (document.visibilityState === "visible") checkPaid();
    };
    document.addEventListener("visibilitychange", onShow);
    window.addEventListener("focus", checkPaid);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
      window.removeEventListener("focus", checkPaid);
    };
  }, [accessToken, axiosPrivate, navigate, onClose, onPaid, payment]);

  if (!payment) return null;

  const isPaid = status?.orderStatus === "PAID" || status?.paymentStatus === "SUCCESS";
  const isCancelled =
    status?.orderStatus === "CANCELLED" ||
    status?.paymentStatus === "FAILED" ||
    status?.orderStatus === "FAILED";

  const amountVnd = status?.amountVnd ?? payment.amountVnd;
  const rate = Math.round(Number(payment.exchangeRate) || 0);
  const totalUsd = Number(status?.totalUsd ?? payment.totalUsd ?? payment.totalAmount) || 0;
  const subtotalUsd = Number(payment.subtotal) || 0;
  const discountUsd = Number(payment.discountAmount) || 0;
  const expiresAt = payment.expiresAt ? new Date(payment.expiresAt) : null;
  const expired =
    !isPaid &&
    !isCancelled &&
    expiresAt instanceof Date &&
    !Number.isNaN(expiresAt.getTime()) &&
    expiresAt.getTime() <= Date.now();

  const pill = isPaid ? "SUCCESS" : isCancelled ? "CANCELLED" : expired ? "EXPIRED" : "PENDING";

  const titles =
    (status?.courseTitles?.length ? status.courseTitles : null) ||
    (payment.courseTitles?.length ? payment.courseTitles : null) ||
    [status?.courseTitle || payment.courseTitle].filter(Boolean);
  const headerTitle =
    titles.length > 1 ? `${titles.length} courses` : titles[0] || "Checkout";

  const handleClose = () => {
    // Closing / skipping payment keeps cart items (Cart only removes them after PAID).
    onClose?.();
  };

  return (
    <div className="payment-modal-backdrop" role="presentation">
      <div className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
        <button className="payment-modal-close" type="button" onClick={handleClose} aria-label="Close payment modal">
          <X size={18} />
        </button>

        <div className="payment-modal-header">
          <div>
            <p>payOS</p>
            <h3 id="payment-modal-title">{headerTitle}</h3>
            {titles.length > 0 ? (
              <ul className="payment-course-list">
                {titles.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <span className={`payment-pill ${isPaid ? "payment-pill--success" : isCancelled || expired ? "payment-pill--failed" : ""}`}>
            {pill}
          </span>
        </div>

        {isPaid ? <div className="payment-success-banner">Payment successful. Opening your courses…</div> : null}

        <div className="payment-modal-grid">
          <div className="payment-qr-panel">
            {isPaid || isCancelled || expired ? (
              <div className="payment-qr-empty">
                <QrCode size={52} />
                <span>{isPaid ? "Paid" : expired ? "QR expired" : "Payment cancelled"}</span>
              </div>
            ) : qrImageSrc ? (
              <img src={qrImageSrc} alt="payOS QR code" />
            ) : !qrError ? (
              <div className="payment-qr-empty">
                <Loader2 size={42} className="payment-spin" />
                <span>Creating QR</span>
              </div>
            ) : (
              <div className="payment-qr-empty">
                <QrCode size={52} />
                <span>{qrError}</span>
              </div>
            )}
          </div>

          <div className="payment-summary-list">
            <div>
              <span>Subtotal (USD)</span>
              <strong>{formatUsd(subtotalUsd)}</strong>
            </div>
            <div>
              <span>Discount (USD)</span>
              <strong>-{formatUsd(discountUsd)}</strong>
            </div>
            <div>
              <span>Total (USD)</span>
              <strong>{formatUsd(totalUsd)}</strong>
            </div>
            <div className="payment-summary-total">
              <span>Pay now (VND)</span>
              <strong>{formatVnd(amountVnd)}</strong>
            </div>
            {rate ? (
              <div className="payment-rate-line">
                <span>Rate</span>
                <strong>1 USD = {rate.toLocaleString("vi-VN")} VND</strong>
              </div>
            ) : null}
            {expiresAt && !Number.isNaN(expiresAt.getTime()) ? (
              <div className="payment-rate-line">
                <span>Expires</span>
                <strong>{expiresAt.toLocaleString()}</strong>
              </div>
            ) : null}
          </div>
        </div>

        <div className="payment-status-line">
          {isPaid ? (
            <span>Payment confirmed. Courses unlocked.</span>
          ) : isCancelled ? (
            <span>Payment skipped. Courses stay in your cart — checkout again anytime.</span>
          ) : expired ? (
            <span>QR expired. Close and create a new payment. Cart items stay.</span>
          ) : (
            <>
              <Loader2 size={16} className="payment-spin" />
              <span>Scan the QR here (English). Amount is pre-filled. Checking every 2 seconds.</span>
            </>
          )}
        </div>

        <p className="payment-hint">
          Prefer this English screen: scan the QR above. Close (X) or Cancel on payOS keeps courses in your cart for later.
          The external payOS website may stay in Vietnamese — that page is owned by payOS, not LearnOva.
        </p>

        {pollError ? <p className="payment-error">{pollError}</p> : null}

        <div className="payment-modal-actions">
          <button
            className="payment-checkout-button"
            type="button"
            onClick={() => window.open(payment.checkoutUrl, "_blank", "noopener,noreferrer")}
            disabled={!payment.checkoutUrl || isPaid || isCancelled || expired}
          >
            <ExternalLink size={18} />
            Open payOS (optional)
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
