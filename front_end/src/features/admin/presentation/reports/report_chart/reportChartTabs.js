import CoursesTab from "./courses/CoursesTab";
import Dashboard from "./dashboard/Dashboard";
import Teacher from "./teacher/Teacher";
import Learning from "./learning/Learning";
import Revenue from "./revenue/Revenue";
import Users from "./users/Users";

export const reportChartTabs = [
  { id: "dashboard", label: "Summary", Component: Dashboard },
  { id: "users", label: "Users", Component: Users },
  { id: "instructors", label: "Instructors", Component: Teacher },
  { id: "courses", label: "Courses", Component: CoursesTab },
  { id: "learning", label: "Learning Metrics", Component: Learning },
  { id: "revenue", label: "Revenue & Vouchers", Component: Revenue },
];
