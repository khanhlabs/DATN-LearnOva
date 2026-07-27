import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { useTranslation } from "react-i18next";
import "./RevenueChart.css";

const revenueChartLabels = [
  "28/05",
  "29/05",
  "30/05",
  "31/05",
  "01/06",
  "02/06",
  "03/06",
];

const totalRevenueValues = [120, 145, 160, 150, 180, 170, 245];
const netRevenueValues = [105, 135, 150, 142, 170, 156, 235];
const reserveFundValues = [20, 14, 28, 12, 18, 22, 10];

const timeRangeFilters = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const verticalHoverLinePlugin = {
  id: "verticalHoverLine",
  afterDraw(chart) {
    const tooltip = chart.tooltip;
    if (!tooltip || tooltip.opacity === 0) {
      return;
    }

    const activeElements = tooltip.getActiveElements();
    if (activeElements.length === 0) {
      return;
    }

    const ctx = chart.ctx;
    const x = activeElements[0].element.x;
    const topY = chart.scales.y.top;
    const bottomY = chart.scales.y.bottom;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, bottomY);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(37, 99, 235, 0.24)";
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  },
};

const RevenueChart = () => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: revenueChartLabels,
        datasets: [
          {
            label: `${t("revenueAdmin.gross")} (Recorded Transactions)`,
            tooltipShortLabel: t("revenueAdmin.gross"),
            data: totalRevenueValues,
            borderColor: "#2563eb",
            pointBackgroundColor: "#2563eb",
            pointBorderColor: "#2563eb",
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.35,
            fill: false,
            borderWidth: 3,
          },
          {
            label: `${t("revenueAdmin.net")} (After Refund Deductions)`,
            tooltipShortLabel: t("revenueAdmin.net"),
            data: netRevenueValues,
            borderColor: "#60a5fa",
            pointBackgroundColor: "#60a5fa",
            pointBorderColor: "#60a5fa",
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.35,
            fill: false,
            borderWidth: 3,
          },
          {
            label: "Reserve Liquidity Fund for Tuition Refund Requests",
            tooltipShortLabel: "Refunds",
            data: reserveFundValues,
            borderColor: "#ef4444",
            pointBackgroundColor: "#ef4444",
            pointBorderColor: "#ef4444",
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.35,
            fill: false,
            borderWidth: 3,
            borderDash: [6, 4],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
          axis: "x",
        },
        hover: {
          mode: "index",
          intersect: false,
        },
        elements: {
          point: {
            hitRadius: 12,
            radius: 4,
            hoverRadius: 6,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            mode: "index",
            intersect: false,
            backgroundColor: "#111827",
            titleColor: "#f8fafc",
            bodyColor: "#f8fafc",
            borderColor: "rgba(148, 163, 184, 0.18)",
            borderWidth: 1,
            padding: 14,
            cornerRadius: 14,
            displayColors: true,
            bodySpacing: 8,
            titleSpacing: 8,
            caretSize: 8,
            caretPadding: 10,
            usePointStyle: true,
            callbacks: {
              title(context) {
                const title = context[0]?.label || "";
                return ["PERIOD", title];
              },
              label(context) {
                const value = context.parsed.y;
                const label =
                  context.dataset.tooltipShortLabel || context.dataset.label;
                return `${label}: $ ${value.toLocaleString("vi-VN")}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: false,
            },
            ticks: {
              color: "#64748b",
              font: {
                size: 12,
                weight: 600,
              },
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: "#9ca3af",
              font: {
                size: 11,
                weight: 600,
              },
              callback(value) {
                return `$ ${value.toLocaleString("vi-VN")}`;
              },
            },
            grid: {
              color: "rgba(226, 232, 240, 0.9)",
              borderDash: [4, 4],
              drawBorder: false,
            },
          },
        },
      },
      plugins: [verticalHoverLinePlugin],
    });

    return () => {
      chart.destroy();
    };
  }, []);

  return (
    <section className="revenueChartCard" aria-label={t("revenueAdmin.metrics")}>
      <div className="revenueChartHeader">
        <div className="revenueChartTitleGroup">
          <h2 className="revenueChartTitle">
            {t("revenueAdmin.metrics")}
          </h2>
          <p className="revenueChartSubtitle">
            {t("revenueAdmin.metricsSubtitle")}
          </p>
        </div>

        <div
          className="revenueChartFilters"
          role="group"
          aria-label="Select time range"
        >
          {timeRangeFilters.map((filter, index) => (
            <button
              key={filter.value}
              type="button"
              className={
                index === 0
                  ? "revenueChartFilterButton active"
                  : "revenueChartFilterButton"
              }
            >
              {t(`revenueAdmin.${filter.value}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="revenueChartBody">
        <div className="revenueChartCanvas">
          <canvas ref={canvasRef} aria-label="Biểu đồ doanh thu theo ngày" />
        </div>

        <div className="revenueChartLegend">
          <div className="revenueChartLegendItem">
            <span className="revenueChartLegendDot gold" />
            <span>{t("revenueAdmin.gross")}</span>
          </div>
          <div className="revenueChartLegendItem">
            <span className="revenueChartLegendDot purple" />
            <span>{t("revenueAdmin.net")}</span>
          </div>
          <div className="revenueChartLegendItem">
            <span className="revenueChartLegendDot red" />
            <span>Liquidity Reserve Fund</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RevenueChart;
