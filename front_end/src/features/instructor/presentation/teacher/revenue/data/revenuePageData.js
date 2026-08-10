export const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );

export const formatCompactCurrency = (value) => {
  const n = Number(value) || 0;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toFixed(0);
};

export const formatDate = (isoOrLocalDate) => {
  if (!isoOrLocalDate) return "-";
  return new Date(isoOrLocalDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export const formatDeltaNote = (deltaPercent, label = "vs previous 30 days") => {
  if (deltaPercent === null || deltaPercent === undefined || !Number.isFinite(deltaPercent)) {
    return label;
  }
  const sign = deltaPercent >= 0 ? "+" : "";
  return `${sign}${deltaPercent.toFixed(1)}% ${label}`;
};
