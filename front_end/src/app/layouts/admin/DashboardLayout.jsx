import { Outlet } from "react-router-dom";
import Header from "../../../shared/components/header/admin_header/Header";
import SidebarAdmin from "../../../shared/components/sidebar/sidebar_admin/SidebarAdmin";
import "./DashboardLayout";

const Dashboard = () => {
  return (
    <div className="adminLayout">
      <SidebarAdmin />

      <div className="adminLayoutContent">
        <Header />

        <main className="adminLayoutMain">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
