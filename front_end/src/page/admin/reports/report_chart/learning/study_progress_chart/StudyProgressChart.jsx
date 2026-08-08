import { Line } from "react-chartjs-2";
import "../../chartConfig.js";
import "./StudyProgressChart.css";

const StudyProgressChart = () => {
  const data = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
    datasets: [
      {
        label: "Average Score",
        data: [42, 45, 48, 52, 55],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.12)",
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: "#3b82f6",
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
        max: 70,
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
          <div className="chartCardLabel">STUDY PROGRESS</div>
          <div className="chartCardTitle">
            Average earned score over time (%)
          </div>
        </div>
        <div className="chartCardBadge chartCardBadgeBlue">55%</div>
      </div>
      <div className="chartContainer">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default StudyProgressChart;
