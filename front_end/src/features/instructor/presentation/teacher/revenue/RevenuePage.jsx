import { FileText, Star, Users, Wallet } from "lucide-react";
import PayoutPanel from "./components/panel/PayoutPanel";
import ChartPanel from "./components/panel/ChartPanel";
import MetricCard from "./components/card/MetricCard";
import TopRevenuePanel from "./components/panel/TopRevenuePanel";
import TransactionsPanel from "./components/panel/TransactionsPanel";
import { useTeacherRevenue } from "./utils/useTeacherRevenue";
import { formatCurrency, formatDate, formatDeltaNote } from "./data/revenuePageData";
import { fillDailySeries } from "../../../../../shared/utils/dateSeries";
import "./RevenuePage";

const DAYS_IN_WINDOW = 30;

const RevenuePage = () => {
  const { data, isLoading, error } = useTeacherRevenue();

  if (isLoading) {
    return (
      <section className="teacher-page teacher-revenue-page">
        <div style={{ textAlign: "center", padding: "2rem" }}>Loading revenue…</div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="teacher-page teacher-revenue-page">
        <div style={{ textAlign: "center", padding: "2rem" }}>Failed to load revenue data.</div>
      </section>
    );
  }

  const revenueByDay = fillDailySeries(data.revenueByDay, { valueKey: "amount" });
  const previousWindowEnd = new Date();
  previousWindowEnd.setDate(previousWindowEnd.getDate() - DAYS_IN_WINDOW);
  const previousRevenueByDay = fillDailySeries(data.previousRevenueByDay, {
    valueKey: "amount",
    endDate: previousWindowEnd,
  });

  const metricCards = [
    {
      label: "Revenue",
      value: formatCurrency(data.revenueTotal),
      note: formatDeltaNote(data.revenueDeltaPercent),
      tone: "blue",
      icon: Wallet,
      sparkline: revenueByDay.map((p) => Number(p.amount)),
    },
    {
      label: "New Students",
      value: String(data.newStudents),
      note: formatDeltaNote(data.studentsDeltaPercent),
      tone: "green",
      icon: Users,
    },
    {
      label: "Orders",
      value: String(data.ordersCount),
      note: formatDeltaNote(data.ordersDeltaPercent),
      tone: "purple",
      icon: FileText,
    },
    {
      label: "Average Rating",
      value: `${data.avgRating.toFixed(1)} / 5`,
      note: "Across all published courses",
      tone: "gold",
      icon: Star,
    },
  ];

  const chartLabels = revenueByDay.map((p) => formatDate(p.day));
  const currentChart = revenueByDay.map((p) => Number(p.amount));
  const previousChart = previousRevenueByDay.map((p) => Number(p.amount));

  const highlights = [
    {
      label: "Highest revenue day",
      value: data.highestRevenueDay ? formatDate(data.highestRevenueDay.day) : "No data yet",
      note: data.highestRevenueDay ? formatCurrency(data.highestRevenueDay.amount) : "-",
      icon: "calendar",
    },
    {
      label: "Total refunds",
      value: formatCurrency(data.totalRefunds),
      note: data.refundsPercentOfOrders != null ? `${data.refundsPercentOfOrders.toFixed(1)}% of revenue` : "No refunds",
      icon: "credit-card",
    },
    {
      label: "Average order value",
      value: formatCurrency(data.avgOrderValue),
      note: `${data.ordersCount} orders in last 30 days`,
      icon: "wallet",
    },
  ];

  return (
    <section className="teacher-page teacher-revenue-page">

      <div className="teacher-revenue-metrics-grid">
        {metricCards.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="teacher-revenue-dashboard-grid">
        <ChartPanel
          chartLabels={chartLabels}
          currentChart={currentChart}
          previousChart={previousChart}
          highlights={highlights}
        />
        <TransactionsPanel transactions={data.transactions} />
        <TopRevenuePanel courses={data.topCourses} />
        <PayoutPanel lifetimeRevenue={data.lifetimeRevenue} revenueTotal={data.revenueTotal} />
      </div>
    </section>
  );
};

export default RevenuePage;
