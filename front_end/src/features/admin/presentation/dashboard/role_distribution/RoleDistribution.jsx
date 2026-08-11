import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Chart from "chart.js/auto";
import "./RoleDistribution.css";

const RoleDistribution = ({ data = [] }) => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const roleData = data.length
    ? data
    : [
        { name: "Students", value: 0, color: "#2563EB", amount: "0" },
        { name: "Instructors", value: 0, color: "#93C5FD", amount: "0" },
        { name: "Administrators", value: 0, color: "#1D4ED8", amount: "0" },
      ];
  const totalUsers = roleData.reduce((total, item) => total + Number(item.count || 0), 0);
  const chartLabels = roleData.map((item) => t(`admin.${item.name.toLowerCase()}`));
  const chartValues = roleData.map((item) => item.count || item.value);
  const chartColors = roleData.map((item) => item.color);

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const chartInstance = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: chartLabels,
        datasets: [
          {
            data: chartValues,
            backgroundColor: chartColors,
            borderColor: "#F8FAFC",
            borderWidth: 4,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        rotation: -90,
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
                const role = roleData[context.dataIndex];
                return `${context.label}: ${role.value}%`;
              },
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
  }, [chartColors, chartLabels, chartValues, roleData]);

  return (
    <section className="roleDistributionCard" aria-label="Role Distribution">
      <div className="roleDistributionHeader">
        <h3 className="roleDistributionTitle">{t("admin.role_distribution")}</h3>
      </div>

      <div className="roleDistributionChartWrap">
        <div className="roleDistributionChart">
          <canvas ref={canvasRef} />
        </div>

        <div className="roleDistributionCenterLabel" aria-hidden="true">
          <span className="roleDistributionCenterValue">{totalUsers}</span>
          <span className="roleDistributionCenterText">{t("admin.totalUsersLabel")}</span>
        </div>
      </div>

      <div className="roleDistributionLegend">
        {roleData.map((item) => (
          <div key={item.name} className="roleDistributionLegendItem">
            <div
              className="roleDistributionLegendDot"
              style={{ backgroundColor: item.color }}
            />

            <div className="roleDistributionLegendContent">
              <p className="roleDistributionLegendName">{t(`admin.${item.name.toLowerCase()}`)}</p>
              <p className="roleDistributionLegendValue">
                {item.value}% · {item.amount}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RoleDistribution;
