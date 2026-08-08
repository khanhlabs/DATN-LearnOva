import CoursesTab from "./courses/CoursesTab.jsx";
import Dashboard from "./dashboard/Dashboard.jsx";
import Teacher from "./teacher/Teacher.jsx";
import Learning from "./learning/Learning.jsx";
import Revenue from "./revenue/Revenue.jsx";
import Users from "./users/Users.jsx";

export const reportChartTabs = [
  { id: "dashboard", label: "Summary", Component: Dashboard },
  { id: "users", label: "Users", Component: Users },
  { id: "instructors", label: "Instructors", Component: Teacher },
  { id: "courses", label: "Courses", Component: CoursesTab },
  { id: "learning", label: "Learning Metrics", Component: Learning },
  { id: "revenue", label: "Revenue & Vouchers", Component: Revenue },
];
