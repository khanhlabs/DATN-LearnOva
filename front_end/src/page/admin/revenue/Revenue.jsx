import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAdminRevenueOverviewApi } from "../../../api/admin/RevenueApi.js";
import { useAxiosPrivate } from "../../../hook/UseAxiosPrivate.js";
import RevenueCard from "./revenueCard/RevenueCard.jsx";
import RevenueChart from "./revenueChart/RevenueChart.jsx";
import RevenueDonut from "./revenueDonut/RevenueDonut.jsx";
import "./Revenue.css";
import { useTranslation } from "react-i18next";

const EMPTY_BREAKDOWN = [];

const Revenue = () => {
  const { t } = useTranslation();
  const axiosPrivate = useAxiosPrivate();
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await getAdminRevenueOverviewApi(axiosPrivate);
        if (!mounted) return;
        setOverview(data);
        setError("");
      } catch {
        if (!mounted) return;
        setOverview(null);
        setError("Unable to load revenue overview.");
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [axiosPrivate]);

  return (
    <div className="revenuePage">
      <div className="revenuePageInner">
        {error ? <p className="revenuePageError">{error}</p> : null}
        <RevenueCard kpis={overview?.kpis} />
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
          <RevenueDonut items={overview?.categoryBreakdown ?? EMPTY_BREAKDOWN} />
        </div>
      </div>
    </div>
  );
};

export default Revenue;
