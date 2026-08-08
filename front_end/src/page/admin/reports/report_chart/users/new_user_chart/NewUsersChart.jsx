import { Line } from "react-chartjs-2";
import "../../chartConfig.js";
import "./NewUsersChart.css";

const NewUsersChart = () => {
  const data = {
    labels: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "New Users",
        data: [3000, 4000, 3800, 4500, 5200, 5600],
        borderColor: "#2563eb",
        backgroundColor: "rgba(255, 140, 0, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: "#2563eb",
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
          callback: (value) => (value / 1000).toFixed(1) + "k users",
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
    <div className="newUsersChartCard">
      <div className="chartCardHeader">
        <div>
          <div className="chartCardLabel">SIGNUP TREND</div>
          <div className="chartCardTitle">
            New member registration trend (last 6 months)
          </div>
        </div>
        <div className="chartCardBadge">Users</div>
      </div>
      <div className="chartContainer">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default NewUsersChart;
