import { Line } from "react-chartjs-2";
import "../../chartConfig.js";
import "./RevenueChart.css";

const RevenueChart = () => {
  const data = {
    labels: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "Revenue",
        data: [850.7, 900.5, 920.3, 950.8, 980.2, 1050.5],
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: "#10b981",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    animation: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    hover: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 14, weight: "600" },
        bodyFont: { size: 13 },
        cornerRadius: 4,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 12, family: 'poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
          color: "#64748b",
          callback: (value) => (value / 100).toFixed(1) + "M",
        },
        grid: {
          color: "rgba(226, 232, 240, 0.9)",
          drawBorder: false,
        },
      },
      x: {
        ticks: {
          font: { size: 12, family: 'poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
          color: "#64748b",
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="revenueChartCard">
      <div className="chartCardHeader">
        <div>
          <div className="chartCardLabel">REVENUE TREND</div>
          <div className="chartCardTitle">
            Course Sales Reconciliation Trend
          </div>
        </div>
        <div className="chartCardBadge chartCardBadgeGreen">Revenue</div>
      </div>
      <div className="chartContainer">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default RevenueChart;
