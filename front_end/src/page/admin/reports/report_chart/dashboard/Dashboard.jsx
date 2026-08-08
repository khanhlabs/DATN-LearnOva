import UserTrendChart from "./user_trend_chart/UserTrendChart.jsx";
import ProgressChart from "./progress_chart/ProgressChart.jsx";
import RevenueChart from "./revenue_chart/RevenueChart.jsx";
import VoucherChart from "./voucher_chart/VoucherChart.jsx";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboardTabContent">
      <div className="dashboardChartsGrid">
        <UserTrendChart />
        <ProgressChart />
        <RevenueChart />
        <VoucherChart />
      </div>
    </div>
  );
};

export default Dashboard;
