import { Bar } from "react-chartjs-2";
import "../../chartConfig.js";
import "./ConversionChart.css";

const ConversionChart = () => {
  const data = {
    labels: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
    datasets: [
      {
        label: "Conversion Rate",
        data: [4, 5, 6, 7, 8, 10],
        backgroundColor: "#10b981",
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
    indexAxis: "y",
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
        callbacks: {
          label: (context) => `${context.parsed.x}%`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 12,
        ticks: {
          font: { size: 12, family: 'poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
          color: "#64748b",
          callback: (value) => value + "%",
        },
        grid: {
          color: "rgba(226, 232, 240, 0.9)",
          drawBorder: false,
        },
      },
      y: {
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
    <div className="conversionChartCard">
      <div className="chartCardHeader">
        <div>
          <div className="chartCardLabel">CONVERSION METRIC</div>
          <div className="chartCardTitle">
            Student to Instructor Conversion Rate
          </div>
        </div>
        <div className="chartCardBadge chartCardBadgeGreen">12%</div>
      </div>
      <div className="horizontalChartContainer">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default ConversionChart;
