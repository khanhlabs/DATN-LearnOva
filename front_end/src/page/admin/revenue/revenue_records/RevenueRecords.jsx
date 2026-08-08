import { Calendar, TrendingUp } from "lucide-react";
import "./RevenueRecords.css";

const formatMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatGrowth = (value) => {
  if (value == null || Number.isNaN(Number(value))) {
    return "No prior month baseline";
  }
  const numeric = Number(value);
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${numeric.toFixed(1)}% growth`;
};

const RevenueRecords = ({ peakDay = null, peakMonth = null }) => {
  return (
    <section className="revenueRecordsSection" aria-label="System revenue records">
      <h4 className="recordsTitle">System Revenue Records</h4>

      <div className="revenueRecordsCard">
        <div className="recordsDivider" />

        <div className="recordsInner">
          <div className="recordItem">
            <div className="recordIcon">
              <Calendar size={20} />
            </div>
            <div className="recordContent">
              <div className="recordLabel">PEAK DATE RANGE</div>
              <div className="recordMain">{peakDay?.label || "—"}</div>
              <div className="recordMeta">
                Rate:{" "}
                <span className="metaHighlight">Highest paid revenue day</span>
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
              <div className="recordLabel">HIGHEST MONTHLY PERFORMANCE</div>
              <div className="recordMain">{peakMonth?.label || "—"}</div>
              <div className="recordMeta">
                Momentum:{" "}
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
