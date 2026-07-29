import { Link } from "react-router-dom";
import RevenueCard from "./revenueCard/RevenueCard.jsx";
import RevenueChart from "./revenueChart/RevenueChart.jsx";
import RevenueDonut from "./revenueDonut/RevenueDonut.jsx";
import "./Revenue.css";
import { useTranslation } from "react-i18next";

const Revenue = () => {
  const { t } = useTranslation();
  return (
    <div className="revenuePage">
      <div className="revenuePageInner">
        <RevenueCard />
        <nav className="revenueQuickNav" aria-label="Revenue detail pages">
          <Link className="revenueQuickNavItem" to="/learnova/admin/revenue/top-rankings">
            {t("revenueAdmin.topTables")}
          </Link>
          <Link className="revenueQuickNavItem" to="/learnova/admin/revenue/transactions">
            {t("revenueAdmin.transactionDetails")}
          </Link>
        </nav>
        <div className="revenueOverviewRow">
          <RevenueChart />
          <RevenueDonut />
        </div>
      </div>
    </div>
  );
};

export default Revenue;
