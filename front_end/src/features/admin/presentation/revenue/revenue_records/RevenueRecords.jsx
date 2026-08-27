import { Calendar, TrendingUp } from "lucide-react";
import "./RevenueRecords.css";
import { useTranslation } from "react-i18next";

const formatMoney = (value) => {
  const amount = Number(value || 0);
  const fractionDigits = Number.isInteger(amount) ? 0 : 2;
  return `$ ${amount.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  })}`;
};

const RevenueRecords = ({ peakDay = null, peakMonth = null }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";

  const formatPeakDay = (label) => {
    if (!label) return "—";
    if (/^\d{4}-\d{2}-\d{2}/.test(label)) {
      const date = new Date(`${label.slice(0, 10)}T00:00:00`);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString(locale, {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    }
    return label;
  };

  const formatPeakMonth = (label) => {
    if (!label) return "—";
    if (/^\d{4}-\d{2}/.test(label)) {
      const date = new Date(`${label.slice(0, 7)}-01T00:00:00`);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleDateString(locale, {
          month: "short",
          year: "numeric",
        });
      }
    }
    return label;
  };

  const formatGrowth = (value) => {
    if (value == null || Number.isNaN(Number(value))) {
      return t("revenueDetails.noPriorMonth");
    }
    const numeric = Number(value);
    const sign = numeric > 0 ? "+" : "";
    return `${sign}${numeric.toFixed(1)}% ${t("revenueDetails.growthSuffix")}`;
  };

  return (
    <section
      className="revenueRecordsSection"
      aria-label={t("revenueDetails.systemRecords")}
    >
      <h4 className="recordsTitle">{t("revenueDetails.systemRecords")}</h4>

      <div className="revenueRecordsCard">
        <div className="recordsDivider" />

        <div className="recordsInner">
          <div className="recordItem">
            <div className="recordIcon">
              <Calendar size={20} />
            </div>
            <div className="recordContent">
              <div className="recordLabel">{t("revenueDetails.peakDateRange")}</div>
              <div className="recordMain">{formatPeakDay(peakDay?.label)}</div>
              <div className="recordMeta">
                {t("revenueDetails.ratePrefix")}{" "}
                <span className="metaHighlight">{t("revenueDetails.highestPaidDay")}</span>
              </div>
            </div>
            <div className="recordValue">
              {peakDay ? formatMoney(peakDay.amount) : "—"}
            </div>
          </div>

          <div className="recordItem">
            <div className="recordIcon grey">
              <TrendingUp size={20} />
            </div>
            <div className="recordContent">
              <div className="recordLabel">{t("revenueDetails.highestMonthly")}</div>
              <div className="recordMain">{formatPeakMonth(peakMonth?.label)}</div>
              <div className="recordMeta">
                {t("revenueDetails.momentumPrefix")}{" "}
                <span className="metaBoost">
                  {formatGrowth(peakMonth?.growthPercent)}
                </span>
              </div>
            </div>
            <div className="recordValue">
              {peakMonth ? formatMoney(peakMonth.amount) : "—"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RevenueRecords;
