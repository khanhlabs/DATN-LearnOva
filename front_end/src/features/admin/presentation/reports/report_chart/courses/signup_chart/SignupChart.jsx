import { Line } from "react-chartjs-2";
import "../../chartConfig";
import "./SignupChart.css";

const SignupChart = () => {
  const data = {
    labels: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "New Signups",
        data: [9800, 11300, 10750, 12100, 13700, 15500],
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.12)",
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: "#2563eb",
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
          color: "#64748b",
          font: { size: 12, family: 'poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
          callback: (value) => `${value / 1000}k`,
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
    <div className="chartCard">
      <div className="chartCardHeader">
        <div>
          <div className="chartCardLabel">ORGANIC SIGNUPS</div>
          <div className="chartCardTitle">Monthly New Enrollments</div>
        </div>
        <div className="chartCardBadge chartCardBadgeBlue">+28%</div>
      </div>
      <div className="chartContainer">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default SignupChart;
