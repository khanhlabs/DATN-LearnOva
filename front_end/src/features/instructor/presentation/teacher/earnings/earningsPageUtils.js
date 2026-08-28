export const formatVnd = (value) => {
  const amount = Number(value || 0);
  return `${Math.round(amount).toLocaleString("vi-VN")}đ`;
};

export const formatPaidAt = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const mapPaymentStatus = (status) => {
  if (!status) return "Unknown";
  const normalized = String(status).toUpperCase();
  if (normalized === "SUCCESS") return "Successful";
  if (normalized === "PENDING") return "Pending";
  if (normalized === "FAILED") return "Failed";
  if (normalized === "REFUNDED") return "Refunded";
  return status;
};