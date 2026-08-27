import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAdminRevenueTransactionInsightsApi } from "../../../infrastructure/api/RevenueApi";
import { useAxiosPrivate } from "../../../../../shared/hooks/useAxiosPrivate";
import RevenueCategory from "../revenue_category/RevenueCategory";
import RevenueRecords from "../revenue_records/RevenueRecords";
import TransactionLog from "../transaction_log/TransactionLog";
import "../Revenue.css";
import { useTranslation } from "react-i18next";

const EMPTY_METRICS = [];

const RevenueTransactions = () => {
  const { t } = useTranslation();
  const axiosPrivate = useAxiosPrivate();
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await getAdminRevenueTransactionInsightsApi(axiosPrivate);
        if (!mounted) return;
        setInsights(data);
        setError("");
      } catch {
        if (!mounted) return;
        setInsights(null);
        setError(t("revenueDetails.insightsLoadError"));
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [axiosPrivate, t]);

  return (
    <div className="revenuePage">
      <div className="revenuePageInner">
        <div className="revenueDetailHeader">
          <div>
            <h2>{t("revenueDetails.transactionDetails")}</h2><p>{t("revenueDetails.transactionDesc")}</p>
          </div>
          <Link className="revenueDetailBack" to="/learnova/admin/revenue">
            {t("revenueDetails.back")}
          </Link>
        </div>

        {error ? <p className="revenuePageError">{error}</p> : null}

        <div className="revenueDetailGrid">
          <div className="revenueDetailMain">
            <TransactionLog />
          </div>
          <div className="revenueDetailSide">
            <RevenueCategory categories={insights?.categoryMetrics ?? EMPTY_METRICS} />
            <RevenueRecords
              peakDay={insights?.peakDay || null}
              peakMonth={insights?.peakMonth || null}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueTransactions;
