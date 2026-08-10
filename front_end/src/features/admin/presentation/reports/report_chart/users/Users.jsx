import NewUsersChart from "./new_user_chart/NewUsersChart";
import ActiveUsersChart from "./active_user_chart/ActiveUsersChart";
import RoleDistributionChart from "./role_distribution_chart/RoleDistributionChart";
import ConversionChart from "./conversion_chart/ConversionChart";
import "./Users";

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
