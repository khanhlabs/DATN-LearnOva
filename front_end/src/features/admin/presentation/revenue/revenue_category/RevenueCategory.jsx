import "./RevenueCategory.css";
import { useTranslation } from "react-i18next";

const BAR_COLORS = [
  "#1f2937",
  "#334155",
  "#4b5563",
  "#6b7280",
  "#94a3b8",
  "#cbd5e1",
];

const formatMoney = (value) => {
  const amount = Number(value || 0);
  const fractionDigits = Number.isInteger(amount) ? 0 : 2;
  return `$ ${amount.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  })}`;
};

const RevenueCategory = ({ categories = [] }) => {
  const { t } = useTranslation();

  return (
    <section
      className="revenueCategorySection"
      aria-label={t("revenueDetails.categoryMetrics")}
    >
      <div className="revenueCategoryHeader">
        <h3>{t("revenueDetails.categoryMetrics")}</h3>
        <span className="revenueCategoryBadge">{t("revenueDetails.percentageShare")}</span>
      </div>

      <div className="revenueCategoryCard">
        <div className="revenueCategoryList">
          {categories.length === 0 ? (
            <p className="revenueCategoryEmpty">{t("revenueDetails.noCategoryRevenue")}</p>
          ) : null}
          {categories.map((item, index) => {
            const percent = Number(item.sharePercent || 0);
            return (
              <div key={item.categoryId || item.categoryName} className="revenueCategoryItem">
                <div className="revenueCategoryLabel">
                  <span>
                    {!item.categoryName || item.categoryName === "Uncategorized"
                      ? t("revenueAdmin.uncategorized")
                      : item.categoryName}
                  </span>
                  <strong>{percent.toFixed(0)}%</strong>
                </div>

                <div className="revenueCategoryAmount">({formatMoney(item.amount)})</div>

                <div className="revenueCategoryBarWrapper">
                  <div
                    className="revenueCategoryBar"
                    style={{
                      width: `${Math.min(Math.max(percent, 0), 100)}%`,
                      backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RevenueCategory;
