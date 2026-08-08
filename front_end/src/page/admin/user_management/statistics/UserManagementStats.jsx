import TotalUsersCard from "./cards/total_user/TotalUsersCard.jsx";
import StudentsCard from "./cards/students/StudentsCard.jsx";
import TeachersCard from "./cards/teacher/TeachersCard.jsx";
import AdminsCard from "./cards/admin/AdminsCard.jsx";
import LockedAccountsCard from "./cards/looked_account/LockedAccountsCard.jsx";
import "./UserManagementStats.css";
import { useTranslation } from "react-i18next";

const formatCount = (value) => new Intl.NumberFormat("en-US").format(value);

const getStatisticsCards = (users, isLoading) => {
  const totalUsers = users.length;
  const students = users.filter((user) => user.roleFilter === "student").length;
  const teachers = users.filter((user) => user.roleFilter === "teacher").length;
  const admins = users.filter((user) => user.roleFilter === "admin").length;
  const lockedAccounts = users.filter(
    (user) => user.statusFilter === "locked",
  ).length;
  const loadingValue = isLoading ? "..." : "0";

  return [
    {
      id: "total-users",
      component: TotalUsersCard,
      title: "Total Users",
      value: totalUsers ? formatCount(totalUsers) : loadingValue,
      trend: "Database live",
      trendTone: "success",
    },
    {
      id: "students",
      component: StudentsCard,
      title: "Students",
      value: students ? formatCount(students) : loadingValue,
      trend: "Database live",
      trendTone: "success",
    },
    {
      id: "teachers",
      component: TeachersCard,
      title: "Instructors",
      value: teachers ? formatCount(teachers) : loadingValue,
      trend: "Database live",
      trendTone: "info",
    },
    {
      id: "admins",
      component: AdminsCard,
      title: "Admins",
      value: admins ? formatCount(admins) : loadingValue,
      trend: "Database live",
      trendTone: "neutral",
    },
    {
      id: "locked-accounts",
      component: LockedAccountsCard,
      title: "Locked Accounts",
      value: lockedAccounts ? formatCount(lockedAccounts) : loadingValue,
      trend: "Inactive/deleted",
      trendTone: "danger",
    },
  ];
};

const UserManagementStats = ({ users = [], isLoading = false }) => {
  const { t } = useTranslation();
  const statisticsCards = getStatisticsCards(users, isLoading).map((card) => ({
    ...card,
    title: t(`admin.${{ "total-users": "totalUsers", students: "students", teachers: "instructors", admins: "administrators", "locked-accounts": "locked" }[card.id]}`),
    trend: t(card.id === "locked-accounts" ? "admin.inactiveDeleted" : "admin.databaseLive"),
  }));

  return (
    <section
      className="userManagementStats"
      aria-label="User Management Statistics"
    >
      {statisticsCards.map((card) => {
        const StatCard = card.component;

        return <StatCard key={card.id} {...card} />;
      })}
    </section>
  );
};

export default UserManagementStats;
