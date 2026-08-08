import { Line } from "react-chartjs-2";
import "../../chartConfig.js";
import "./GrowthChart.css";

const GrowthChart = () => {
  const data = {
    labels: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "New Instructors",
        data: [92, 105, 110, 118, 125, 134],
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.12)",
        fill: true,
        tension: 0.45,
        pointRadius: 4,
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
        ticks: { color: "#64748b", font: { size: 12, family: 'poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' } },
        grid: { color: "rgba(226, 232, 240, 0.9)", drawBorder: false },
      },
      x: {
        ticks: { color: "#64748b", font: { size: 12, family: 'poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' } },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="chartCard">
      <div className="chartCardHeader">
        <div>
          <div className="chartCardLabel">INSTRUCTOR SCALE</div>
          <div className="chartCardTitle">New Instructor Growth Rate</div>
        </div>
        <div className="chartCardBadge chartCardBadgeOrange">+16%</div>
      </div>
      <div className="chartContainer">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default GrowthChart;
