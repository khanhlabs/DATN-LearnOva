import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { useTranslation } from "react-i18next";

import { getAdminRevenueComparisonApi } from "../../../infrastructure/api/RevenueApi";
import { useAxiosPrivate } from "../../../../../shared/hooks/useAxiosPrivate";
import "./RevenueChart.css";

const timeRangeFilters = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const formatMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

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
  const chartRef = useRef(null);
  const axiosPrivate = useAxiosPrivate();
  const [range, setRange] = useState("month");
  const [points, setPoints] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getAdminRevenueComparisonApi(
          { range },
          axiosPrivate
        );
        if (!mounted) return;
        setPoints(Array.isArray(data?.points) ? data.points : []);
        setError("");
      } catch {
        if (!mounted) return;
        setPoints([]);
        setError("Unable to load revenue comparison chart.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [axiosPrivate, range]);

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    const labels = points.map((point) => point.label);
    const studentValues = points.map((point) => Number(point.totalCashFlow || 0));
    const instructorValues = points.map((point) =>
      Number(point.instructorPayouts || 0)
    );
    const adminValues = points.map((point) => Number(point.adminNet || 0));

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: t("revenueAdmin.studentPayments"),
            tooltipShortLabel: t("revenueAdmin.studentPayments"),
            data: studentValues,
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
            label: t("revenueAdmin.instructorShare"),
            tooltipShortLabel: t("revenueAdmin.instructorShare"),
            data: instructorValues,
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
          {
            label: t("revenueAdmin.adminNet"),
            tooltipShortLabel: t("revenueAdmin.adminNet"),
            data: adminValues,
            borderColor: "#16a34a",
            pointBackgroundColor: "#16a34a",
            pointBorderColor: "#16a34a",
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.35,
            fill: false,
            borderWidth: 3,
            borderDash: [2, 3],
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
                return `${label}: ${formatMoney(value)}`;
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
                return formatMoney(value);
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
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [points, t]);

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
          {timeRangeFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={
                range === filter.value
                  ? "revenueChartFilterButton active"
                  : "revenueChartFilterButton"
              }
              onClick={() => setRange(filter.value)}
            >
              {t(`revenueAdmin.${filter.value}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="revenueChartBody">
        {error ? <p className="revenueChartError">{error}</p> : null}
        {loading && !points.length ? (
          <p className="revenueChartEmpty">Loading chart…</p>
        ) : null}
        <div className="revenueChartCanvas">
          <canvas ref={canvasRef} aria-label="Revenue comparison chart" />
        </div>

        <div className="revenueChartLegend">
          <div className="revenueChartLegendItem">
            <span className="revenueChartLegendDot gold" />
            <span>{t("revenueAdmin.studentPayments")}</span>
          </div>
          <div className="revenueChartLegendItem">
            <span className="revenueChartLegendDot red" />
            <span>{t("revenueAdmin.instructorShare")}</span>
          </div>
          <div className="revenueChartLegendItem">
            <span className="revenueChartLegendDot green" />
            <span>{t("revenueAdmin.adminNet")}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RevenueChart;
