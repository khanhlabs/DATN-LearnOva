import NewUsersChart from "./new_user_chart/NewUsersChart.jsx";
import ActiveUsersChart from "./active_user_chart/ActiveUsersChart.jsx";
import RoleDistributionChart from "./role_distribution_chart/RoleDistributionChart.jsx";
import ConversionChart from "./conversion_chart/ConversionChart.jsx";
import "./Users.css";

const Users = () => {
  return (
    <div className="usersTabContent">
      <div className="usersChartsGrid">
        <NewUsersChart />
        <ActiveUsersChart />
        <RoleDistributionChart />
        <ConversionChart />
      </div>
    </div>
  );
};

export default Users;
