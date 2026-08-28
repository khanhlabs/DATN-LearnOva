import {
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import TotalRevenueCard from "./total_revenue_card/TotalRevenueCard";
import MonthlyRevenueCard from "./mothly_revenue_card/MonthlyRevenueCard";
import TransactionsCard from "./transactions_card/TransactionsCard";
import PendingPaymentCard from "./pending_payment_card/PendingPaymentCard";
import GrowthRateCard from "./growth_rate_card/GrowthRateCard";
import "./RevenueCard.css";
import { useTranslation } from "react-i18next";

const formatMoney = (value) => {
  const amount = Number(value || 0);
  const fractionDigits = Number.isInteger(amount) ? 0 : 2;
  return `$ ${amount.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  })}`;
};

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
  const { t } = useTranslation();
  const labels = {
    totalRevenue: t("revenueAdmin.total"),
    monthlyRevenue: t("revenueAdmin.monthly"),
    transactions: t("revenueAdmin.transactions"),
    pendingPayment: t("revenueAdmin.pending"),
    growthRate: t("revenueAdmin.growth"),
  };
  const revenueBlocks = [
    {
      id: "totalRevenue",
      component: TotalRevenueCard,
      title: labels.totalRevenue,
      value: formatMoney(kpis?.totalRevenue),
      delta: formatDelta(kpis?.totalRevenueDeltaPercent),
      subtitle: t("revenueAdmin.quarter"),
      icon: DollarSign,
    },
    {
      id: "monthlyRevenue",
      component: MonthlyRevenueCard,
      title: labels.monthlyRevenue,
      value: formatMoney(kpis?.monthlyRevenue),
      delta: formatDelta(kpis?.monthlyRevenueDeltaPercent),
      subtitle: t("revenueAdmin.monthStart"),
      icon: Calendar,
    },
    {
      id: "transactions",
      component: TransactionsCard,
      title: labels.transactions,
      value: formatCount(kpis?.totalTransactions),
      delta: formatDelta(kpis?.totalTransactionsDeltaPercent),
      subtitle: t("revenueAdmin.previous"),
      icon: CreditCard,
    },
    {
      id: "pendingPayment",
      component: PendingPaymentCard,
      title: labels.pendingPayment,
      value: formatMoney(kpis?.pendingPayoutAmount),
      note: `${formatCount(kpis?.pendingPayoutCount ?? 0)} ${t("revenueAdmin.settlement")}`,
      icon: Clock,
    },
    {
      id: "growthRate",
      component: GrowthRateCard,
      title: labels.growthRate,
      value: formatDelta(kpis?.growthRatePercent),
      detail:
        kpis?.growthRatePercent == null
          ? "—"
          : Number(kpis.growthRatePercent) >= 0
            ? t("revenueAdmin.quarter")
            : t("revenueAdmin.quarter"),
      icon: TrendingUp,
    },
  ];

  return (
    <section className="revenueSection" aria-label={t("admin.revenue")}>
      <div className="revenueContainer">
        <div className="revenueGrid">
          {revenueBlocks.map((block) => {
            const { id, component: BlockComponent, ...cardProps } = block;
            return <BlockComponent key={id} {...cardProps} />;
          })}
        </div>
      </div>
    </section>
  );
};

export default RevenueCard;