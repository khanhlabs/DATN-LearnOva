import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import "./RevenueDonut.css";
import { useTranslation } from "react-i18next";

const revenueDonutLabels = [
  "New Courses",
  "VIP Bundle Sales",
  "Support Services",
  "Other Fees",
];

const revenueDonutValues = [42, 28, 18, 12];
const revenueDonutColors = ["#2563eb", "#60a5fa", "#22c55e", "#8b5cf6"];

const RevenueDonut = () => {
  const { t } = useTranslation();
  const donutRef = useRef(null);

  useEffect(() => {
    if (!donutRef.current) {
      return undefined;
    }

    const donutChart = new Chart(donutRef.current, {
      type: "doughnut",
      data: {
        labels: revenueDonutLabels,
        datasets: [
          {
            data: revenueDonutValues,
            backgroundColor: revenueDonutColors,
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
                return `${context.label}: ${context.parsed}%`;
              },
            },
          },
        },
      },
    });

    return () => {
      donutChart.destroy();
    };
  }, []);

  return (
    <section className="revenueDonutCard" aria-label="Revenue source breakdown">
      <div className="revenueDonutHeader">
        <div>
          <h2 className="revenueDonutTitle">{t("revenueAdmin.source")}</h2>
          <p className="revenueDonutSubtitle">
            {t("revenueAdmin.sourceSubtitle")}
          </p>
        </div>
      </div>

      <div className="revenueDonutBody">
        <div className="revenueDonutChartWrapper">
          <canvas ref={donutRef} aria-label="Revenue composition donut chart" />
          <div className="revenueDonutCenter">
            <div className="revenueDonutCenterValue">$2.5M</div>
            <div className="revenueDonutCenterLabel">{t("revenueAdmin.breakdown")}</div>
            <div className="revenueDonutCenterPercent">100% {t("revenueAdmin.revenueLabel")}</div>
          </div>
        </div>

        <div className="revenueDonutLegend">
          {revenueDonutLabels.map((label, index) => (
            <div key={label} className="revenueDonutLegendItem">
              <span
                className="revenueDonutLegendDot"
                style={{ backgroundColor: revenueDonutColors[index] }}
              />
              <span className="revenueDonutLegendText">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RevenueDonut;
