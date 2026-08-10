import { Doughnut } from "react-chartjs-2";
import "../../chartConfig";
import "./VoucherChart";

const VoucherChart = () => {
  const data = {
    labels: ["Discount", "Cashback", "Shipping", "Other"],
    datasets: [
      {
        data: [45, 28, 15, 12],
        backgroundColor: ["#f59e0b", "#2563eb", "#22c55e", "#c084fc"],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    animation: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#334155",
          boxWidth: 12,
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        displayColors: false,
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  return (
    <div className="voucherChartCard">
      <div className="chartCardHeader">
        <div>
          <div className="chartCardLabel">VOUCHER</div>
          <div className="chartCardTitle">Voucher usage breakdown by type</div>
        </div>
        <div className="chartCardBadge chartCardBadgeOrange">45%</div>
      </div>
      <div className="chartContainer">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
};

export default VoucherChart;
