import "./RevenueCategory";

const BAR_COLORS = [
  "#1f2937",
  "#334155",
  "#4b5563",
  "#6b7280",
  "#94a3b8",
  "#cbd5e1",
];

const formatMoney = (value) =>
  `$ ${Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;

const RevenueCategory = ({ categories = [] }) => {
  return (
    <section
      className="revenueCategorySection"
      aria-label="Revenue Category Metrics"
    >
      <div className="revenueCategoryHeader">
        <h3>Revenue Category Metrics</h3>
        <span className="revenueCategoryBadge">Percentage Share</span>
      </div>

      <div className="revenueCategoryCard">
        <div className="revenueCategoryList">
          {categories.length === 0 ? (
            <p className="revenueCategoryEmpty">No category revenue yet.</p>
          ) : null}
          {categories.map((item, index) => {
            const percent = Number(item.sharePercent || 0);
            return (
              <div key={item.categoryId || item.categoryName} className="revenueCategoryItem">
                <div className="revenueCategoryLabel">
                  <span>{item.categoryName}</span>
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
