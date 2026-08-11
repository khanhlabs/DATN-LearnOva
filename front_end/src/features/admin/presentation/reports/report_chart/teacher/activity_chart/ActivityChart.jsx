import { Line } from "react-chartjs-2";
import "../../chartConfig";
import "./ActivityChart.css";

const ActivityChart = () => {
  const data = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
    datasets: [
      {
        label: "Interactions",
        data: [520, 590, 610, 670, 715],
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#10b981",
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
          <div className="chartCardLabel">INSTRUCTOR INTERACTION</div>
          <div className="chartCardTitle">Live Q&A Session Trend</div>
        </div>
        <div className="chartCardBadge chartCardBadgeGreen">+22%</div>
      </div>
      <div className="chartContainer">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default ActivityChart;
