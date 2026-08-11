const STORAGE_KEY = "learnova_pending_payos";

const courseKey = (courseIds = []) =>
  [...courseIds].map(Number).filter(Boolean).sort((a, b) => a - b).join(",");

const isExpired = (payment) => {
  if (!payment?.expiresAt) return false;
  const expiresAt = new Date(payment.expiresAt).getTime();
  return Number.isFinite(expiresAt) && expiresAt <= Date.now();
};

export const savePendingPayOsPayment = (payment, courseIds = []) => {
  if (!payment?.orderId || (!payment?.qrCode && !payment?.checkoutUrl)) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        courseKey: courseKey(courseIds),
        payment,
        savedAt: Date.now(),
      })
    );
  } catch {
    // ignore quota / private mode
  }
};

export const getPendingPayOsPayment = (courseIds = []) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.payment) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (courseKey(courseIds) && parsed.courseKey !== courseKey(courseIds)) {
      return null;
    }
    if (isExpired(parsed.payment)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (
      parsed.payment.orderStatus === "CANCELLED" ||
      parsed.payment.paymentStatus === "FAILED" ||
      parsed.payment.orderStatus === "PAID" ||
      parsed.payment.paymentStatus === "SUCCESS"
    ) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.payment;
  } catch {
    return null;
  }
};

export const clearPendingPayOsPayment = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};
