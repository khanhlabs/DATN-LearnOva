import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import "./RevenueDonut.css";
import { useTranslation } from "react-i18next";

const DONUT_COLORS = [
  "#2563eb",
  "#60a5fa",
  "#22c55e",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
  "#64748b",
];

const formatCompactMoney = (value) => {
  const amount = Number(value || 0);
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};


const RevenueDonut = ({ items = [] }) => {
  const donutRef = useRef(null);
  const chartRef = useRef(null);

  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const labels = items.map((item) => item.categoryName || "Uncategorized");
  const values = items.map((item) => Number(item.amount || 0));
  const colors = labels.map((_, index) => DONUT_COLORS[index % DONUT_COLORS.length]);

  useEffect(() => {
    if (!donutRef.current) {
      return undefined;
    }

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    chartRef.current = new Chart(donutRef.current, {
      type: "doughnut",
      data: {
        labels: labels.length ? labels : ["No data"],
        datasets: [
          {
            data: values.length ? values : [1],
            backgroundColor: values.length ? colors : ["#e2e8f0"],
            borderColor: "#f8fafc",
            borderWidth: 4,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            displayColors: false,
            padding: 12,
            backgroundColor: "#ffffff",
            titleColor: "#0f172a",
            bodyColor: "#475569",
            borderColor: "#cbd5e1",
            borderWidth: 1,
            cornerRadius: 6,
            callbacks: {
              label(context) {
                if (!values.length) {
                  return "No paid revenue by category yet";
                }
                const amount = Number(context.parsed || 0);
                const share = total > 0 ? ((amount / total) * 100).toFixed(1) : "0.0";
                return `${context.label}: ${formatCompactMoney(amount)} (${share}%)`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [items]);

  return (
    <section className="revenueDonutCard" aria-label="Revenue source breakdown">
      <div className="revenueDonutHeader">
        <div>
          <h2 className="revenueDonutTitle">{t("revenueAdmin.source")}</h2>
          <p className="revenueDonutSubtitle">
            Paid course revenue allocated by training category.
          </p>
        </div>
      </div>

      <div className="revenueDonutBody">
        <div className="revenueDonutChartWrapper">
          <canvas ref={donutRef} aria-label="Revenue composition donut chart" />
          <div className="revenueDonutCenter">
            <div className="revenueDonutCenterValue">{formatCompactMoney(total)}</div>
            <div className="revenueDonutCenterLabel">TOTAL BREAKDOWN</div>
            <div className="revenueDonutCenterPercent">
              {items.length ? "100% Revenue" : "No data"}
            </div>
          </div>
        </div>

        <div className="revenueDonutLegend">
          {labels.length === 0 ? (
            <div className="revenueDonutLegendItem">
              <span className="revenueDonutLegendText">No category revenue yet</span>
            </div>
          ) : (
            labels.map((label, index) => (
              <div key={`${label}-${index}`} className="revenueDonutLegendItem">
                <span
                  className="revenueDonutLegendDot"
                  style={{ backgroundColor: colors[index] }}
                />
                <span className="revenueDonutLegendText">{label}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default RevenueDonut;
