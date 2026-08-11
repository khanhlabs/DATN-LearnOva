import { Clock3, Info, MessageSquareText, Star, TrendingDown, TrendingUp, Users } from "lucide-react";

export const buildAnalyticsStats = (data) => [
  {
    label: "Completion Rate",
    value: `${data.completionRate.toFixed(1)}%`,
    compare: "Average across all your students",
    tone: "blue",
    icon: TrendingUp,
  },
  {
    label: "Average Rating",
    value: `${data.avgRating.toFixed(1)}/5`,
    compare: `Based on ${data.ratingCount} review${data.ratingCount === 1 ? "" : "s"}`,
    tone: "gold",
    icon: Star,
  },
  {
    label: "Average Watch Time",
    value: `${Math.round(data.avgWatchTimeMinutes)}m`,
    compare: "Per lesson session started",
    tone: "green",
    icon: Clock3,
  },
  {
    label: "Drop-off Rate",
    value: `${data.dropOffRate.toFixed(1)}%`,
    compare: "Lesson sessions started but not completed",
    tone: "red",
    icon: TrendingDown,
    negative: true,
  },
];

export const buildEngagementItems = (engagement) => [
  {
    label: "Active students",
    value: String(engagement.activeStudents),
    progress: engagement.totalStudents > 0 ? (engagement.activeStudents / engagement.totalStudents) * 100 : 0,
    note: `of ${engagement.totalStudents} total students`,
    icon: Users,
    tone: "blue",
  },
  {
    label: "Lessons completed",
    value: String(engagement.lessonsCompleted),
    progress: 100,
    note: "Total lesson completions",
    icon: TrendingUp,
    tone: "green",
  },
  {
    label: "Questions asked",
    value: String(engagement.questionsAsked),
    progress: 100,
    note: "In lesson Q&A",
    icon: MessageSquareText,
    tone: "purple",
  },
  {
    label: "Reviews submitted",
    value: String(engagement.reviewsSubmitted),
    progress: 100,
    note: "Across all your courses",
    icon: Info,
    tone: "gold",
  },
];
