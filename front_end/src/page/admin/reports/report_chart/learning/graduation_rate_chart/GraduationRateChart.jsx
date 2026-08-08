import { Line } from "react-chartjs-2";
import "../../chartConfig.js";
import "./GraduationRateChart.css";

const GraduationRateChart = () => {
  const data = {
    labels: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "Completion",
        data: [58, 60, 62, 63, 65, 67],
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.15)",
        fill: true,
        tension: 0.38,
        pointRadius: 5,
        pointBackgroundColor: "#f59e0b",
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
        max: 80,
        ticks: {
          color: "#64748b",
          font: { size: 12, family: 'poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
          callback: (value) => `${value}%`,
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
          <div className="chartCardLabel">GRADUATION RATE</div>
          <div className="chartCardTitle">
            Average course completion rate (%)
          </div>
        </div>
        <div className="chartCardBadge chartCardBadgeOrange">67%</div>
      </div>
      <div className="chartContainer">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default GraduationRateChart;
