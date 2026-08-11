import UserTrendChart from "./user_trend_chart/UserTrendChart";
import ProgressChart from "./progress_chart/ProgressChart";
import RevenueChart from "./revenue_chart/RevenueChart";
import VoucherChart from "./voucher_chart/VoucherChart";
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
