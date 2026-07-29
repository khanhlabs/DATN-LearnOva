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

const revenueBlocks = [
  {
    id: "totalRevenue",
    component: TotalRevenueCard,
    title: "TOTAL REVENUE",
    value: "$ 2,450,000",
    delta: "+12.4%",
    subtitle: "This Quarter",
    icon: DollarSign,
  },
  {
    id: "monthlyRevenue",
    component: MonthlyRevenueCard,
    title: "MONTHLY REVENUE",
    value: "$ 185,300",
    delta: "+8.5%",
    subtitle: "Since Month Start",
    icon: Calendar,
  },
  {
    id: "transactions",
    component: TransactionsCard,
    title: "TOTAL TRANSACTIONS",
    value: "15,820",
    delta: "+15.2%",
    subtitle: "Compared to Previous Period",
    icon: CreditCard,
  },
  {
    id: "pendingPayment",
    component: PendingPaymentCard,
    title: "PENDING PAYMENTS",
    value: "$ 0",
    note: "0 Instructors Awaiting Settlement",
    icon: Clock,
  },
  {
    id: "refundRequest",
    component: RefundRequestCard,
    title: "REFUND REQUESTS",
    value: "2",
    delta: "-4.2%",
    label: "Low Rate",
    icon: RefreshCcw,
  },
  {
    id: "growthRate",
    component: GrowthRateCard,
    title: "GROWTH RATE",
    value: "+12.4%",
    detail: "Exceeded Target by 2.4%",
    icon: TrendingUp,
  },
];

const RevenueCard = () => {
  const { t } = useTranslation();
  const labels = { totalRevenue: t("revenueAdmin.total"), monthlyRevenue: t("revenueAdmin.monthly"), transactions: t("revenueAdmin.transactions"), pendingPayment: t("revenueAdmin.pending"), refundRequest: t("revenueAdmin.refunds"), growthRate: t("revenueAdmin.growth") };
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
