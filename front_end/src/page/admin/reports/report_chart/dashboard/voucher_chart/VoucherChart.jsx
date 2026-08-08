import { Bar } from "react-chartjs-2";
import "../../chartConfig.js";
import "./VoucherChart.css";

const VoucherChart = () => {
  const data = {
    labels: ["01/05", "07/05", "14/05", "21/05", "28/05", "04/06"],
    datasets: [
      {
        label: "Voucher",
        data: [80, 120, 200, 320, 500, 850],
        backgroundColor: "#8b5cf6",
        borderRadius: 4,
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
          callback: (value) => value + " uses",
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
    <div className="voucherChartCard">
      <div className="chartCardHeader">
        <div>
          <div className="chartCardLabel">PROMOTION PERFORMANCE</div>
          <div className="chartCardTitle">
            Weekly Voucher and Discount Code Usage
          </div>
        </div>
        <div className="chartCardBadge chartCardBadgePurple">Promotion</div>
      </div>
      <div className="chartContainer">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default VoucherChart;
