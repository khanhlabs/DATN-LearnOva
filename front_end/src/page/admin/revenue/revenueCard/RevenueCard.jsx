import {
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  RefreshCcw,
  TrendingUp,
} from "lucide-react";
import TotalRevenueCard from "./totalRevenueCard/TotalRevenueCard.jsx";
import MonthlyRevenueCard from "./monthlyRevenueCard/MonthlyRevenueCard.jsx";
import TransactionsCard from "./transactionsCard/TransactionsCard.jsx";
import PendingPaymentCard from "./pendingPaymentCard/PendingPaymentCard.jsx";
import RefundRequestCard from "./refundRequestCard/RefundRequestCard.jsx";
import GrowthRateCard from "./growthRateCard/GrowthRateCard.jsx";
import "./RevenueCard.css";
import { useTranslation } from "react-i18next";

const formatMoney = (value) =>
  `$ ${Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;

const formatDelta = (value) => {
  if (value == null || Number.isNaN(Number(value))) {
    return "—";
  }
  const numeric = Number(value);
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${numeric.toFixed(1)}%`;
};

const formatCount = (value) => Number(value || 0).toLocaleString("en-US");

const RevenueCard = ({ kpis = null }) => {
  const revenueBlocks = [
    {
      id: "totalRevenue",
      component: TotalRevenueCard,
      title: "TOTAL REVENUE",
      value: formatMoney(kpis?.totalRevenue),
      delta: formatDelta(kpis?.totalRevenueDeltaPercent),
      subtitle: "This Quarter",
      icon: DollarSign,
    },
    {
      id: "monthlyRevenue",
      component: MonthlyRevenueCard,
      title: "MONTHLY REVENUE",
      value: formatMoney(kpis?.monthlyRevenue),
      delta: formatDelta(kpis?.monthlyRevenueDeltaPercent),
      subtitle: "Since Month Start",
      icon: Calendar,
    },
    {
      id: "transactions",
      component: TransactionsCard,
      title: "TOTAL TRANSACTIONS",
      value: formatCount(kpis?.totalTransactions),
      delta: formatDelta(kpis?.totalTransactionsDeltaPercent),
      subtitle: "Compared to Previous Period",
      icon: CreditCard,
    },
    {
      id: "pendingPayment",
      component: PendingPaymentCard,
      title: "PENDING PAYMENTS",
      value: formatMoney(kpis?.pendingPayoutAmount),
      note: `${formatCount(kpis?.pendingPayoutCount)} Instructors Awaiting Settlement`,
      icon: Clock,
    },
    {
      id: "refundRequest",
      component: RefundRequestCard,
      title: "REFUND REQUESTS",
      value: formatCount(kpis?.refundCount),
      delta: formatDelta(kpis?.refundDeltaPercent),
      label: "Refunded payments",
      icon: RefreshCcw,
      deltaTone:
        Number(kpis?.refundDeltaPercent) > 0 ? "negative" : "positive",
    },
    {
      id: "growthRate",
      component: GrowthRateCard,
      title: "GROWTH RATE",
      value: formatDelta(kpis?.growthRatePercent),
      detail:
        kpis?.growthRatePercent == null
          ? "No prior quarter baseline"
          : Number(kpis.growthRatePercent) >= 0
            ? "Quarter-over-quarter growth"
            : "Quarter-over-quarter decline",
      icon: TrendingUp,
    },
  ];

  return (
    <section className="revenueSection" aria-label={t("admin.revenue")}>
      <div className="revenueContainer">
        <div className="revenueGrid">
          {revenueBlocks.map((block) => {
            const { id, component: BlockComponent, ...cardProps } = block;
            return <BlockComponent key={id} {...cardProps} title={labels[id]} subtitle={id === "totalRevenue" ? t("revenueAdmin.quarter") : id === "monthlyRevenue" ? t("revenueAdmin.monthStart") : id === "transactions" ? t("revenueAdmin.previous") : cardProps.subtitle} note={id === "pendingPayment" ? `0 ${t("revenueAdmin.settlement")}` : cardProps.note} label={id === "refundRequest" ? t("revenueAdmin.lowRate") : cardProps.label} detail={id === "growthRate" ? t("revenueAdmin.target") : cardProps.detail} />;
          })}
        </div>
      </div>
    </section>
  );
};

export default RevenueCard;
