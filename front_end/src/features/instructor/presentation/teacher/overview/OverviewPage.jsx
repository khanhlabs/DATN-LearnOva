import {AlertCircle, BookOpenCheck, ChevronRight, Clock, FileEdit, MessageSquare, Star, TrendingDown, TrendingUp, Trash2, UserPlus, Users, WalletCards, XCircle,} from "lucide-react";
import { Link } from "react-router-dom";
import { overviewLinks } from "./utils/OverviewConfig";
import { useDashboard } from "./utils/useDashboard";
import { fillDailySeries } from "../../../../../shared/utils/dateSeries";
import "./OverviewPage";

const statTones = ["blue", "gold", "green", "violet"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );

const formatPrice = (value) => {
  const n = Number(value);
  if (!n) return "Free";
  return formatCurrency(n);
};

const formatDate = (isoString) => {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const timeAgo = (isoString) => {
  if (!isoString) return "-";
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(isoString);
};

const Panel = ({ title, action, cardClassName = "", children }) => (
  <section className={`overview-card ${cardClassName}`}>
    <div className="overview-panel__title-row">
      <h2 className="overview-panel__title">{title}</h2>
      {action}
    </div>
    <hr className="overview-panel__divider" />
    {children}
  </section>
);

const DeltaBadge = ({ percent }) => {
  if (percent === null || percent === undefined || !Number.isFinite(percent)) return null;
  const isUp = percent >= 0;
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <em className={`overview-delta ${isUp ? "overview-delta--up" : "overview-delta--down"}`}>
      <Icon size={12} />
      {Math.abs(percent).toFixed(1)}% vs last month
    </em>
  );
};

const MetricCard = ({ icon: Icon, label, value, sub, delta, index }) => {
  const tone = statTones[index] || "blue";

  return (
    <article className={`overview-card overview-metric overview-tone-${tone}`}>
      <div className="overview-metric__heading">
        <span>
          <Icon size={20} />
        </span>
        <p>{label}</p>
      </div>
      <strong>{value}</strong>
      {sub && <span className="overview-metric__sub">{sub}</span>}
      <DeltaBadge percent={delta} />
    </article>
  );
};

const statusDotMeta = {
  published: { label: "Published", color: "#1d4ed8" },
  draft: { label: "Draft", color: "#ca8a04" },
  pendingReview: { label: "Pending", color: "#c2410c" },
  rejected: { label: "Rejected", color: "#dc2626" },
  deleted: { label: "Deleted", color: "#64748b" },
};

const CoursesMetricCard = ({ counts }) => {
  const total =
    (counts?.published ?? 0) +
    (counts?.draft ?? 0) +
    (counts?.pendingReview ?? 0) +
    (counts?.rejected ?? 0) +
    (counts?.deleted ?? 0);

  return (
    <article className="overview-card overview-metric overview-tone-violet">
      <div className="overview-metric__heading">
        <span>
          <BookOpenCheck size={20} />
        </span>
        <p>Courses</p>
      </div>
      <strong>{total}</strong>
      <div className="overview-courses-dots">
        {Object.entries(statusDotMeta).map(([key, meta]) =>
          counts?.[key] ? (
            <span key={key} className="overview-courses-dot">
              <i style={{ background: meta.color }} />
              {counts[key]} {meta.label}
            </span>
          ) : null
        )}
      </div>
    </article>
  );
};

const buildLinePath = (values, height, viewWidth) => {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const stepX = values.length > 1 ? viewWidth / (values.length - 1) : viewWidth;

  return values
    .map((v, i) => {
      const x = values.length > 1 ? i * stepX : viewWidth / 2;
      const y = height - (v / max) * (height - 10);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
};

const LineChart = ({ title, headline, delta, points, valueKey, color, gradientId, formatValue, emptyLabel }) => {
  const values = points.map((p) => Number(p[valueKey]));
  const linePath = buildLinePath(values, 126, 524);
  const maxValue = Math.max(...values, 0);

  return (
    <Panel title={title} cardClassName="overview-revenue">
      <strong>{headline}</strong>
      <DeltaBadge percent={delta} />

      {linePath ? (
        <div className="overview-revenue__chart">
          <div className="overview-revenue__axis">
            <span>{formatValue(maxValue)}</span>
            <span>{formatValue(maxValue / 2)}</span>
            <span>{formatValue(0)}</span>
          </div>
          <svg viewBox="0 0 524 126" preserveAspectRatio="none" aria-label={title}>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={color} stopOpacity="0.04" />
              </linearGradient>
            </defs>
            <path d={`${linePath} L524,126 L0,126 Z`} fill={`url(#${gradientId})`} />
            <path d={linePath} fill="none" stroke={color} strokeLinecap="round" strokeWidth="3" />
          </svg>
          <div className="overview-revenue__months">
            <span>{formatDate(points[0]?.day)}</span>
            <span>{formatDate(points[points.length - 1]?.day)}</span>
          </div>
        </div>
      ) : (
        <p style={{ marginTop: 24, color: "#64748b" }}>{emptyLabel}</p>
      )}
    </Panel>
  );
};

const ratingStars = (rating) => {
  const rounded = Math.round(Number(rating) || 0);
  return "★".repeat(rounded) + "☆".repeat(Math.max(0, 5 - rounded));
};

const TopCoursesTable = ({ courses }) => (
  <Panel
    title="Top Courses"
    cardClassName="overview-courses"
    action={<Link to={overviewLinks.courses}>View all</Link>}
  >
    {courses.length === 0 ? (
      <p style={{ marginTop: 16, color: "#64748b" }}>No published courses yet.</p>
    ) : (
      <table className="overview-course-table">
        <colgroup>
          <col style={{ width: "38%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "16%" }} />
          <col style={{ width: "16%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Course</th>
            <th>Rating</th>
            <th>Students</th>
            <th>Revenue</th>
            <th>Completion</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.courseId}>
              <td>
                <div className="overview-course-table__course">
                  <img src={course.thumbnailUrl} alt={course.title} />
                  <div>
                    <strong>{course.title}</strong>
                    <span>{course.categoryName || "Uncategorized"}</span>
                  </div>
                </div>
              </td>
              <td>
                <div className="overview-course-table__rating">
                  <span className="overview-course-table__stars">{ratingStars(course.avgRating)}</span>
                  <span>({course.ratingCount})</span>
                </div>
              </td>
              <td>{course.studentCount}</td>
              <td>{formatPrice(course.revenue)}</td>
              <td>
                <div className="overview-course-table__completion">
                  <span>{course.completionRate.toFixed(0)}%</span>
                  <div className="overview-progress">
                    <div className="overview-progress__bar" style={{ width: `${Math.min(100, course.completionRate)}%` }} />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </Panel>
);

const RecentEnrollments = ({ enrollments }) => (
  <Panel
    title="Recent Enrollments"
    cardClassName="overview-enrollments"
    action={<Link to={overviewLinks.courses}>View all</Link>}
  >
    <div className="overview-enrollments__list">
      {enrollments.length === 0 && <p style={{ color: "#64748b" }}>No enrollments yet.</p>}
      {enrollments.map((enrollment, index) => (
        <div key={`${enrollment.studentId}-${enrollment.courseId}-${index}`} className="overview-enrollment">
          <img
            src={enrollment.studentAvatar || "https://ui-avatars.com/api/?background=1d4ed8&color=fff&name=Student"}
            alt={enrollment.studentName}
          />
          <div>
            <strong>{enrollment.studentName}</strong>
            <p>{enrollment.courseTitle}</p>
          </div>
          <span>
            <UserPlus size={16} />
          </span>
          <time>{timeAgo(enrollment.enrolledAt)}</time>
        </div>
      ))}
    </div>
  </Panel>
);

const NeedYourAttention = ({ attention }) => {
  if (!attention) return null;

  const items = [];
  if (attention.rejectedCourse) {
    items.push({
      key: "rejected",
      icon: XCircle,
      tone: "red",
      title: "Rejected Course",
      description: `"${attention.rejectedCourse.title}" was rejected${
        attention.rejectedCourse.reason ? `: ${attention.rejectedCourse.reason}` : "."
      }`,
      actionLabel: "Review now",
      to: overviewLinks.courseEdit(attention.rejectedCourse.courseId),
    });
  }
  if (attention.pendingReviewCourse) {
    items.push({
      key: "pending",
      icon: Clock,
      tone: "gold",
      title: "Pending Review",
      description: `"${attention.pendingReviewCourse.title}" is waiting for review.`,
      actionLabel: "Review now",
      to: overviewLinks.courseEdit(attention.pendingReviewCourse.courseId),
    });
  }
  if (attention.newReviewCount > 0) {
    items.push({
      key: "reviews",
      icon: MessageSquare,
      tone: "violet",
      title: "New Reviews",
      description: `You have ${attention.newReviewCount} new review${attention.newReviewCount > 1 ? "s" : ""}.`,
      actionLabel: "Check now",
      to: overviewLinks.reviews,
    });
  }

  return (
    <Panel title="Need Your Attention" cardClassName="overview-sidebar-panel">
      {items.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: 13 }}>You&apos;re all caught up.</p>
      ) : (
        <div className="overview-attention__list">
          {items.map((item) => (
            <div key={item.key} className={`overview-attention overview-attention--${item.tone}`}>
              <span className="overview-attention__icon">
                <item.icon size={16} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <Link to={item.to}>
                  {item.actionLabel}
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
};

const statusChipIcon = {
  published: BookOpenCheck,
  draft: FileEdit,
  pendingReview: Clock,
  rejected: XCircle,
  deleted: Trash2,
};

const CourseStatusOverview = ({ counts }) => (
  <Panel title="Course Status Overview" cardClassName="overview-sidebar-panel">
    <div className="overview-status-grid">
      {Object.entries(statusDotMeta).map(([key, meta]) => {
        const Icon = statusChipIcon[key];
        return (
          <div key={key} className="overview-status-chip">
            <span className="overview-status-chip__icon" style={{ background: `${meta.color}1a`, color: meta.color }}>
              <Icon size={16} />
            </span>
            <div>
              <strong>{meta.label}</strong>
              <span>{counts?.[key] ?? 0}</span>
            </div>
          </div>
        );
      })}
    </div>
  </Panel>
);

const OverviewPage = () => {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return <div className="teacher-overview">Loading dashboard…</div>;
  }

  if (error || !data) {
    return <div className="teacher-overview">Failed to load dashboard.</div>;
  }

  const revenueByDay = fillDailySeries(data.revenueByDay, { valueKey: "amount" });

  return (
    <div className="teacher-overview">
      <section className="overview-metrics" aria-label="Teacher metrics">
        <MetricCard icon={Users} label="Students" value={data.totalStudents} delta={data.studentsDeltaPercent} index={0} />
        <MetricCard
          icon={Star}
          label="Avg. Rating"
          value={data.avgRating.toFixed(1)}
          sub={`${data.ratingCount} reviews`}
          index={1}
        />
        <MetricCard
          icon={WalletCards}
          label="Revenue"
          value={formatCurrency(data.revenueTotal)}
          delta={data.revenueDeltaPercent}
          index={2}
        />
        <MetricCard
          icon={AlertCircle}
          label="Completion Rate"
          value={`${data.completionRate.toFixed(1)}%`}
          sub="Avg. across all students"
          index={3}
        />
        <CoursesMetricCard counts={data.courseStatusCounts} />
      </section>

      <section className="overview-dashboard-grid">
        <LineChart
          title="Revenue Overview"
          headline={formatCurrency(data.revenueTotal)}
          delta={data.revenueDeltaPercent}
          points={revenueByDay}
          valueKey="amount"
          color="#2563eb"
          gradientId="overviewRevenueFill"
          formatValue={formatCurrency}
          emptyLabel="No paid orders in the last 30 days."
        />
        <LineChart
          title="Student Growth"
          headline={String(data.totalStudents)}
          delta={data.studentsDeltaPercent}
          points={data.studentGrowth}
          valueKey="cumulativeStudents"
          color="#10b981"
          gradientId="overviewGrowthFill"
          formatValue={(v) => Math.round(v).toString()}
          emptyLabel="No new enrollments in the last 30 days."
        />

        <aside className="overview-sidebar">
          <NeedYourAttention attention={data.attention} />
          <RecentEnrollments enrollments={data.recentEnrollments} />
        </aside>

        <CourseStatusOverview counts={data.courseStatusCounts} />
        <TopCoursesTable courses={data.topCourses} />
      </section>
    </div>
  );
};

export default OverviewPage;
