import { Bar } from "react-chartjs-2";
import "../../chartConfig.js";
import "./EngagementChart.css";

const EngagementChart = () => {
  const data = {
    labels: ["Tháng 12", "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5"],
    datasets: [
      {
        label: "Engagement",
        data: [62, 65, 63, 68, 70, 73],
        backgroundColor: "#10b981",
        borderRadius: 8,
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
        max: 85,
        ticks: {
          color: "#64748b",
          font: { size: 12, family: 'poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
          callback: (value) => `${value} pts`,
        },
        grid: { color: "rgba(226, 232, 240, 0.9)", drawBorder: false },
      },
      x: {
        ticks: { color: "#64748b", font: { size: 12, family: 'poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' } },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="learningChartCard">
      <div className="chartCardHeader">
        <div>
          <div className="chartCardLabel">ENGAGEMENT</div>
          <div className="chartCardTitle">
            Active study hour interaction score
          </div>
        </div>
        <div className="chartCardBadge chartCardBadgeGreen">73 pts</div>
      </div>
      <div className="chartContainer">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default EngagementChart;
