import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { useTranslation } from "react-i18next";
import { getAdminVouchersApi } from "../../../infrastructure/api/VoucherApi";
import { useAxiosPrivate } from "../../../../../shared/hooks/useAxiosPrivate";
import "./VoucherChart.css";

const activationSeries = {
  id: "activation",
  name: "Voucher Programs",
  borderColor: "#2563eb",
  pointBackgroundColor: "#2563eb",
  pointBorderColor: "#ffffff",
};

const formatMonthLabel = (month) => {
  const [year, monthNumber] = String(month || "").split("-");
  if (!year || !monthNumber) {
    return "";
  }

  return `M${Number(monthNumber)}/${year}`;
};

const getCurrentYear = () => new Date().getFullYear();

const buildYearMonths = (year) =>
  Array.from({ length: 12 }, (_, index) => {
    const monthNumber = index + 1;
    return `${year}-${String(monthNumber).padStart(2, "0")}`;
  });

const buildVoucherChartData = (voucherItems, year = getCurrentYear()) => {
  const activationsByMonth =
    voucherItems
      .map((item) => String(item.endDate || "").slice(0, 7))
      .filter((month) => month.startsWith(`${year}-`))
      .reduce((months, month) => {
        months.set(month, (months.get(month) || 0) + 1);
        return months;
      }, new Map());
  const yearMonths = buildYearMonths(year);

  return {
    labels: yearMonths.map((month) => formatMonthLabel(month)),
    series: [
      {
        ...activationSeries,
        values: yearMonths.map((month) => activationsByMonth.get(month) || 0),
      },
    ],
  };
};

const VoucherChart = ({ refreshKey }) => {
  const { t } = useTranslation();
  const axiosPrivate = useAxiosPrivate();
  const canvasRef = useRef(null);
  const [vouchers, setVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchVouchers = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await getAdminVouchersApi(axiosPrivate);
        if (mounted) {
          setVouchers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (mounted) {
          setVouchers([]);
          setError(
            err?.response?.data?.message || "Failed to load voucher data."
          );
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchVouchers();

    return () => {
      mounted = false;
    };
  }, [axiosPrivate, refreshKey]);

  const chartYear = useMemo(() => getCurrentYear(), []);
  const voucherChartData = useMemo(
    () => buildVoucherChartData(vouchers, chartYear),
    [chartYear, vouchers]
  );
  const hasCurrentYearData = voucherChartData.series.some((series) =>
    series.values.some((value) => value > 0)
  );

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    const ctx = canvasRef.current.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, "rgba(37, 99, 235, 0.22)");
    gradient.addColorStop(1, "rgba(37, 99, 235, 0.04)");

    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: voucherChartData.labels,
        datasets: voucherChartData.series.map((series) => ({
          label: t("opsAdmin.programs"),
          data: series.values,
          borderColor: series.borderColor,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: series.pointBackgroundColor,
          pointBorderColor: series.pointBorderColor,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: "#ffffff",
          pointHoverBorderColor: series.borderColor,
          pointBorderWidth: 2,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            backgroundColor: "rgba(17, 24, 39, 0.92)",
            titleColor: "#f8fafc",
            bodyColor: "#f8fafc",
            borderColor: "rgba(148, 163, 184, 0.18)",
            borderWidth: 1,
            padding: 10,
            cornerRadius: 10,
            displayColors: false,
            callbacks: {
              label(context) {
                return `${t("opsAdmin.vouchers")}: ${context.parsed.y}`;
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
              color: "#9ca3af",
              font: {
                size: 12,
                weight: 500,
              },
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(156, 163, 175, 0.18)",
              borderDash: [4, 4],
              drawBorder: false,
            },
            ticks: {
              color: "#9ca3af",
              font: {
                size: 12,
                weight: 500,
              },
              precision: 0,
            },
          },
        },
      },
    });

    return () => {
      chart.destroy();
    };
  }, [t, voucherChartData]);

  return (
    <section
      className="voucherChartSection"
      aria-label={t("opsAdmin.usageFrequency")}
    >
      <div className="voucherChartHeader">
        <div>
          <h2 className="voucherChartTitle">{t("opsAdmin.usageFrequency")}</h2>
          <p className="voucherChartSubtitle">
            {t("opsAdmin.usageStats")}
          </p>
        </div>
        <div className="voucherChartLegend">
          {voucherChartData.series.map((series) => (
            <div key={series.id} className="voucherChartLegendItem">
              <span
                className="voucherChartLegendDot"
                style={{ backgroundColor: series.borderColor }}
              />
              <span>{t("opsAdmin.programs")}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="voucherChartCanvasWrapper">
        <canvas ref={canvasRef} aria-label={t("opsAdmin.usageFrequency")} />
        {isLoading && (
          <div className="voucherChartStatus">{t("common.loading")}</div>
        )}
        {!isLoading && error && (
          <div className="voucherChartStatus voucherChartStatusError">
            {error}
          </div>
        )}
        {!isLoading && !error && !hasCurrentYearData && (
          <div className="voucherChartStatus">
            {t("opsAdmin.noUsage")}
          </div>
        )}
      </div>
    </section>
  );
};

export default VoucherChart;
