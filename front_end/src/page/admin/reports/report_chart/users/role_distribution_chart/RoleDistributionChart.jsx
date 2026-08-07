import { Doughnut } from "react-chartjs-2";
import "../../chartConfig.js";
import "./RoleDistributionChart.css";

const RoleDistributionChart = () => {
  const data = {
    labels: ["Students", "Instructors", "Admins", "TAs"],
    datasets: [
      {
        data: [43240, 1240, 200, 600],
        backgroundColor: ["#2563eb", "#2563eb", "#10b981", "#8b5cf6"],
        borderColor: "#fff8f0",
        borderWidth: 3,
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
        position: "right",
        labels: {
          font: { size: 13, family: 'poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
          color: "#5e4734",
          padding: 16,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 14, weight: "600" },
        bodyFont: { size: 13 },
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="roleDistributionChartCard">
      <div className="chartCardHeader">
        <div>
          <div className="chartCardLabel">USER STRUCTURE</div>
          <div className="chartCardTitle">User role distribution</div>
        </div>
      </div>
      <div className="doughnutChartContainer">
        <div className="doughnutChart">
          <Doughnut data={data} options={options} />
        </div>
        <div className="doughnutStats">
          <div className="statItem">
            <div className="statLabel">USERS</div>
            <div className="statValue">45.280</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleDistributionChart;
