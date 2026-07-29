import { Link } from "react-router-dom";
import RevenueCategory from "./revenueCategory/RevenueCategory.jsx";
import RevenueRecords from "./revenueRecords/RevenueRecords.jsx";
import TransactionLog from "./transactionLog/TransactionLog.jsx";
import "./Revenue.css";
import { useTranslation } from "react-i18next";

const RevenueTransactions = () => {
  const { t } = useTranslation();
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

        <div className="revenueDetailGrid">
          <div className="revenueDetailMain">
            <TransactionLog />
          </div>
          <div className="revenueDetailSide">
            <RevenueCategory />
            <RevenueRecords />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueTransactions;
