import { Bar } from "react-chartjs-2";
import "../../chartConfig.js";
import "./CategoryChart.css";

const CategoryChart = () => {
  const data = {
    labels: ["Courses", "New Subscriptions", "Upgrades", "Renewals"],
    datasets: [
      {
        label: "Revenue",
        data: [220, 135, 190, 160],
        backgroundColor: "#2563eb",
        borderRadius: 12,
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
      legend: { display: false },
      tooltip: { displayColors: false, padding: 12, cornerRadius: 6 },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "#4b5563",
          font: { size: 12, family: 'poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
          callback: (value) => `${value}M`,
        },
        grid: { color: "rgba(37, 99, 235, 0.1)", drawBorder: false },
      },
      x: {
        ticks: { color: "#4b5563", font: { size: 12, family: 'poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' } },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="revenueChartCard">
      <div className="chartCardHeader">
        <div>
          <div className="chartCardLabel">REVENUE</div>
          <div className="chartCardTitle">Revenue distribution by source</div>
        </div>
        <div className="chartCardBadge chartCardBadgeBlue">720M</div>
      </div>
      <div className="chartContainer">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default CategoryChart;
