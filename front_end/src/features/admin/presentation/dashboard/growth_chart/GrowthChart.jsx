import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { useTranslation } from "react-i18next";
import AdminHoverSelect from "../../shared/AdminHoverSelect";
import "./GrowthChart";

const monthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const GrowthChart = ({
  series = [],
  yearOptions = [],
  selectedYear,
  onYearChange,
  emptyMessage = "No user growth data for the selected year.",
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [fallbackYear, setFallbackYear] = useState(yearOptions[0]?.value || "");
  const currentYear = selectedYear || fallbackYear;
  const setCurrentYear = onYearChange || setFallbackYear;
  const translatedMonths = t("admin.months", { returnObjects: true });
  const chartLabels = series.length
    ? series.map((item) => translatedMonths[monthLabels.indexOf(item.month)] || item.month)
    : translatedMonths;
  const chartData = series.length ? series.map((item) => item.value) : monthLabels.map(() => 0);
  const maxValue = Math.max(...chartData, 0);
  const chartMax = Math.max(4, Math.ceil((maxValue || 1) * 1.25));
  const hasGrowthData = chartData.some((value) => Number(value || 0) > 0);

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const chartInstance = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: t("admin.users"),
            data: chartData,
            backgroundColor: "#2563EB",
            hoverBackgroundColor: "#1D4ED8",
            borderRadius: 0,
            borderSkipped: false,
            barThickness: 80,
            maxBarThickness: 44,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            displayColors: false,
            padding: 12,
            backgroundColor: "#FFFFFF",
            titleColor: "#0F172A",
            bodyColor: "#475569",
            borderColor: "#CBD5E1",
            borderWidth: 1,
            cornerRadius: 6,
            callbacks: {
              label(context) {
                return `${context.parsed.y.toLocaleString("en-US")} users`;
              },
            },
          },
        },
        layout: {
          padding: {
            top: 8,
            right: 0,
            bottom: 0,
            left: 0,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: false,
            },
            ticks: {
              color: "#475569",
              font: {
                size: 12,
                weight: 600,
              },
            },
          },
          y: {
            beginAtZero: true,
            suggestedMax: chartMax,
            ticks: {
              color: "#64748B",
              font: {
                size: 11,
                weight: 600,
              },
              callback(value) {
                return value === 0 ? "0" : `${value}`;
              },
            },
            grid: {
              color: "rgba(203, 213, 225, 0.6)",
              borderDash: [4, 4],
              drawBorder: false,
            },
          },
        },
      },
    });

    chartRef.current = chartInstance;

    return () => {
      chartInstance.destroy();
      chartRef.current = null;
    };
  }, [chartData, chartLabels, chartMax]);

  return (
    <section className="growthChartCard" aria-label={t("admin.userGrowth")}>
      <div className="growthChartCardHeader">
        <div className="growthChartCardTitleGroup">
          <h3 className="growthChartCardTitle">{t("admin.userGrowth")}</h3>
        </div>

        <div className="growthChartCardFilter">
          <AdminHoverSelect
            id="growthChartYear"
            className="growthChartCardSelect"
            options={yearOptions}
            value={currentYear}
            onChange={setCurrentYear}
            ariaLabel={t("admin.selectGrowthYear")}
          />
        </div>
      </div>

      <div className="growthChartCardBody">
        <div className="growthChartChartArea">
          <canvas ref={canvasRef} />
          {!hasGrowthData && (
            <p className="growthChartEmptyMessage">{emptyMessage}</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default GrowthChart;
