import { FiActivity, FiAward, FiBookOpen, FiUsers } from "react-icons/fi";

export const reportSummaryCards = [
  {
    id: "total-users",
    label: "Total Users",
    count: "45,280",
    note: "Up 14.2% from last month",
    icon: FiUsers,
    iconClassName: "reportCardIconAccent",
  },
  {
    id: "active-users",
    label: "Active Users",
    count: "21,840",
    note: "Currently online learners",
    icon: FiActivity,
    iconClassName: "reportCardIconAccentBlue",
  },
  {
    id: "total-teachers",
    label: "Instructors",
    count: "1,260",
    note: "Top quality instructors",
    icon: FiAward,
    iconClassName: "reportCardIconAccentGold",
  },
  {
    id: "published-courses",
    label: "Published Courses",
    count: "320",
    note: "New courses released this month",
    icon: FiBookOpen,
    iconClassName: "reportCardIconAccentPeach",
  },
];
