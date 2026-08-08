import CoursePerformancePanel from "./components/CoursePerformancePanel.jsx";
import DemographicsPanel from "./components/DemographicsPanel.jsx";
import LearningPerformancePanel from "./components/LearningPerformancePanel.jsx";
import LessonsAttentionPanel from "./components/LessonsAttentionPanel.jsx";
import StudentEngagementPanel from "./components/StudentEngagementPanel.jsx";
import AnalyticsStatCard from "./components/AnalyticsStatCard.jsx";
import { buildAnalyticsStats, buildEngagementItems } from "./AnalyticsData.js";
import { useTeacherAnalytics } from "./useTeacherAnalytics.js";
import { fillDailySeries } from "../../../utils/dateSeries.js";
import "./AnalyticsPage.css";

// Gender is nominal (no inherent order): each identity keeps its own fixed hue.
// "Unspecified" isn't a real category, just missing data, so it gets a neutral gray.
const GENDER_COLORS = {
  Male: "#2563eb",
  Female: "#f59e0b",
  Other: "#7c3aed",
  Unspecified: "#cbd5e1",
};

// Age bands are ordinal (order carries meaning): one hue, monotone light-to-dark
// walking the sequence. "Unknown" isn't part of the sequence, so it's neutral gray.
const AGE_COLORS = {
  "Under 18": "#86b6ef",
  "18-24": "#5598e7",
  "25-34": "#2a78d6",
  "35-44": "#1c5cab",
  "45+": "#104281",
  Unknown: "#cbd5e1",
};

// Color follows the entity (its label), never its rank — so display order can
// change (or not) without repainting which category owns which hue.
const buildDemographicItems = (distribution, colorMap) => {
  const entries = Object.entries(distribution || {}).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  if (total === 0) return [];

  return entries.map(([label, count]) => ({
    label,
    value: Math.round((count / total) * 100),
    color: colorMap[label] || "#cbd5e1",
  }));
};

const AnalyticsPage = () => {
  const { data, isLoading, error } = useTeacherAnalytics();

  if (isLoading) {
    return (
      <section className="teacher-page teacher-analytics-page">
        <div style={{ textAlign: "center", padding: "2rem" }}>Loading analytics…</div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="teacher-page teacher-analytics-page">
        <div style={{ textAlign: "center", padding: "2rem" }}>Failed to load analytics.</div>
      </section>
    );
  }

  const analyticsStats = buildAnalyticsStats(data);
  const engagementItems = buildEngagementItems(data.engagement);
  const dailyCompletions = fillDailySeries(data.dailyCompletions, { dayKey: "day", valueKey: "count" });
  const chartLabels = dailyCompletions.map((p) => p.day);
  const completions = dailyCompletions.map((p) => p.count);

  const attentionItems = data.lessonsAttention.map((lesson) => ({
    title: lesson.lessonTitle,
    detail: lesson.courseTitle,
    value: `${lesson.dropOffRate.toFixed(0)}%`,
    label: `Drop-off · ${lesson.startedCount} started`,
    tone: lesson.dropOffRate >= 50 ? "red" : "orange",
  }));

  const genderItems = buildDemographicItems(data.demographics.genderDistribution, GENDER_COLORS);
  const ageItems = buildDemographicItems(data.demographics.ageDistribution, AGE_COLORS);

  return (
    <section className="teacher-page teacher-analytics-page">
      <div className="teacher-analytics-stat-grid">
        {analyticsStats.map((item) => (
          <AnalyticsStatCard key={item.label} item={item} />
        ))}
      </div>

      <div className="teacher-analytics-main-grid">
        <LearningPerformancePanel chartLabels={chartLabels} completions={completions} />
        <CoursePerformancePanel courses={data.coursePerformance} />
        <StudentEngagementPanel items={engagementItems} />
        <LessonsAttentionPanel items={attentionItems} />
        <DemographicsPanel demographicItems={genderItems} title="Student gender" />
        <DemographicsPanel demographicItems={ageItems} title="Student age groups" />
      </div>
    </section>
  );
};

export default AnalyticsPage;
