import { useEffect, useMemo, useRef, useState } from "react";
import { getAdminDashboardApi } from "../../../api/admin/DashboardApi.js";
import { getAdminCoursesApi } from "../../../api/admin/CourseApi.js";
import { getAdminInstructorsApi } from "../../../api/admin/InstructorApi.js";
import { getAdminUsersApi } from "../../../api/admin/AdminUserApi.js";
import { useAxiosPrivate } from "../../../hook/UseAxiosPrivate.js";
import Statistics from "./statistics/Statistics";
import "./Dashboard.css";
import GrowthChart from "./growthChart/GrowthChart";
import RoleDistribution from "./roleDistribution/RoleDistribution";
import UserRow from "./userRow/UserRow";
import TeacherRow from "./teacherRow/TeacherRow";
import ActivityRow from "./activityRow/ActivityRow";

const monthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentYear = new Date().getFullYear();

const dashboardYearOptions = Array.from({ length: 3 }, (_, index) => {
  const endYear = currentYear - index;
  const startYear = endYear - 1;

  return {
    value: `${startYear}-${endYear}`,
    label: `${startYear} - ${endYear}`,
  };
});
const defaultDashboardYear = dashboardYearOptions[0].value;

const emptyDashboardData = {
  statistics: {},
  growthSeries: [],
  roleDistribution: [],
  recentUsers: [],
  featuredInstructors: [],
  recentActivity: [],
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const isActiveRecord = (item) => !item?.isDeleted;

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(Number(value || 0));

const formatCompactNumber = (value) => {
  const number = Number(value || 0);

  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(1)}k`;

  return formatNumber(number);
};

const formatUsd = (value) => {
  const amount = Number(value || 0);

  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;

  return `$${formatNumber(amount.toFixed(2))}`;
};

const formatRelativeTime = (value) => {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "--";

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (elapsedSeconds < 60) return "Just now";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)}d ago`;

  return date.toLocaleDateString("en-GB");
};

const getYearFromRange = (rangeValue) => {
  const parts = String(rangeValue || "").split("-");
  return Number(parts[1] || new Date().getFullYear());
};

const getDateTime = (value) => {
  const time = new Date(value || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const getFallbackDate = (index) => new Date(Date.now() - (index + 1) * 5 * 60 * 1000).toISOString();

// Instructor ID detection with fallback chain.
// DB field names in priority order: instructorId, id, userId.
// TODO: Standardize DB schema to use single "instructorId" field name.
const getInstructorId = (instructor) => instructor?.instructorId || instructor?.id || instructor?.userId;

const getCourseId = (course) => course?.id || course?.courseId;

// Avatar field detection with fallback chain.
// DB field names in priority order: avatar, avatarUrl, profileImage, profileImageUrl, imageUrl, photoUrl.
// TODO: Standardize DB schema to use single "avatar" field name.
const getInstructorAvatar = (instructor) =>
  instructor?.avatar
  || instructor?.avatarUrl
  || instructor?.profileImage
  || instructor?.profileImageUrl
  || instructor?.imageUrl
  || instructor?.photoUrl
  || "";

const sumNumbers = (items, selector) =>
  items.reduce((total, item) => total + Number(selector(item) || 0), 0);

const normalizeRoleFromDb = (role) => {
  const roleText = String(role || "").toUpperCase();

  if (roleText.includes("ADMIN")) return "Administrator";
  if (roleText.includes("TEACHER") || roleText.includes("INSTRUCTOR")) return "Instructor";

  return "Student";
};

const mapRecentUsersFromDb = (users) =>
  toArray(users)
    .filter(isActiveRecord)
    .sort((first, second) => getDateTime(second.createdAt) - getDateTime(first.createdAt))
    .slice(0, 4)
    .map((user) => ({
      id: user.id,
      name: user.fullName || user.email || `User #${user.id}`,
      email: user.email || "-",
      role: normalizeRoleFromDb(user.role),
    }));

const mapFeaturedInstructorsFromDb = (instructors) =>
  toArray(instructors)
    .filter(isActiveRecord)
    .sort((first, second) => {
      const revenueDiff = Number(second.totalRevenue || 0) - Number(first.totalRevenue || 0);
      if (revenueDiff !== 0) return revenueDiff;
      return Number(second.totalStudents || 0) - Number(first.totalStudents || 0);
    })
    .slice(0, 4)
    .map((instructor, index) => {
      const courses = toArray(instructor.courses);
      const ratedCourses = courses.filter((course) => Number(course.rating || 0) > 0);
      const averageRating = ratedCourses.length
        ? sumNumbers(ratedCourses, (course) => course.rating) / ratedCourses.length
        : 0;

      return {
        id: getInstructorId(instructor),
        name: instructor.fullName || instructor.name || instructor.email || `Instructor #${getInstructorId(instructor)}`,
        courses: Number(instructor.numberOfClasses || courses.length || 0),
        rating: averageRating ? averageRating.toFixed(1) : "0.0",
        rank: index + 1,
        avatar: getInstructorAvatar(instructor),
      };
    });

const mapRecentActivityFromDb = ({ users = [], instructors = [], courses = [] }) => {
  const userActivities = toArray(users).map((user, index) => ({
    id: `user-${user.id || user.email || index}`,
    label: "New user",
    title: user.fullName || user.name || user.email || `User #${user.id || index + 1}`,
    date: user.createdAt || user.updatedAt || getFallbackDate(index),
  }));

  const instructorActivities = toArray(instructors).map((instructor, index) => {
    const instructorId = getInstructorId(instructor);

    return {
      id: `instructor-${instructorId || instructor.email || index}`,
      label: "Instructor update",
      title: instructor.fullName || instructor.name || instructor.email || `Instructor #${instructorId || index + 1}`,
      date: instructor.updatedAt || instructor.createdAt || getFallbackDate(userActivities.length + index),
    };
  });

  const courseActivities = toArray(courses).map((course, index) => {
    const courseId = getCourseId(course);
    const courseDate = course.publishedAt || course.updatedAt || course.createdAt;

    return {
      id: `course-${courseId || index}`,
      label: course.publishedAt || course.status === "PUBLISHED" ? "Course published" : "Course created",
      title: course.title || course.name || `Course #${courseId || index + 1}`,
      date: courseDate || getFallbackDate(userActivities.length + instructorActivities.length + index),
    };
  });

  return [...userActivities, ...instructorActivities, ...courseActivities]
    .filter((activity) => activity.title && getDateTime(activity.date) > 0)
    .sort((first, second) => getDateTime(second.date) - getDateTime(first.date))
    .slice(0, 4)
    .map(({ date, ...activity }) => ({
      ...activity,
      time: formatRelativeTime(date),
    }));
};

const mapRecentActivityFromDashboard = ({
  recentActivity = [],
  recentUsers = [],
  featuredInstructors = [],
  courses = [],
}) => {
  const apiActivities = toArray(recentActivity)
    .filter((activity) => activity?.label && activity?.title)
    .slice(0, 4)
    .map((activity, index) => ({
      id: activity.id || `activity-${index}`,
      label: activity.label,
      title: activity.title,
      time: activity.time || formatRelativeTime(activity.date || getFallbackDate(index)),
    }));

  if (apiActivities.length > 0) return apiActivities;

  return mapRecentActivityFromDb({
    users: recentUsers,
    instructors: featuredInstructors,
    courses,
  });
};

const getDebugSnapshot = (value) => {
  if (Array.isArray(value)) return value.slice(0, 3);
  return value;
};

const logDashboardFallbackData = ({ users, instructors, courses }) => {
  if (!import.meta.env.DEV) return;

  console.debug("[AdminDashboard] Users sample:", getDebugSnapshot(users));
  console.debug("[AdminDashboard] Instructors sample:", getDebugSnapshot(instructors));
  console.debug("[AdminDashboard] Courses sample:", getDebugSnapshot(courses));
};

const mapRoleDistributionFromDb = (users) => {
  const roleItems = toArray(users);

  if (roleItems.every((item) => item?.name && item?.color && item?.amount !== undefined)) {
    return roleItems;
  }

  if (roleItems.every((item) => item?.name && item?.count !== undefined)) {
    const totalUsers = Math.max(
      roleItems.reduce((total, item) => total + Number(item.count || 0), 0),
      1,
    );
    const colorByName = {
      Students: "#2563EB",
      Instructors: "#93C5FD",
      Administrators: "#1D4ED8",
    };

    return roleItems.map((item) => ({
      name: item.name,
      count: Number(item.count || 0),
      color: colorByName[item.name] || "#2563EB",
      value: Math.round((Number(item.count || 0) / totalUsers) * 100),
      amount: formatCompactNumber(item.count),
    }));
  }

  const activeUsers = toArray(users).filter(isActiveRecord);
  const totals = activeUsers.reduce(
    (result, user) => {
      const role = normalizeRoleFromDb(user.role);
      return { ...result, [role]: result[role] + 1 };
    },
    { Student: 0, Instructor: 0, Administrator: 0 },
  );
  const totalUsers = Math.max(activeUsers.length, 1);

  return [
    { name: "Students", count: totals.Student, color: "#2563EB" },
    { name: "Instructors", count: totals.Instructor, color: "#93C5FD" },
    { name: "Administrators", count: totals.Administrator, color: "#1D4ED8" },
  ].map((item) => ({
    ...item,
    value: Math.round((item.count / totalUsers) * 100),
    amount: formatCompactNumber(item.count),
  }));
};

const mapUserGrowthFromDb = (users, year) => {
  const monthlyCounts = new Map(monthLabels.map((month) => [month, 0]));

  toArray(users).forEach((user) => {
    const createdAt = new Date(user.createdAt || 0);
    if (Number.isNaN(createdAt.getTime())) return;
    if (createdAt.getUTCFullYear() !== year) return;

    const month = monthLabels[createdAt.getUTCMonth()];
    if (!month) return;

    monthlyCounts.set(month, monthlyCounts.get(month) + 1);
  });

  return monthLabels.map((month) => ({
    month,
    value: monthlyCounts.get(month) || 0,
  }));
};

const mapStatisticsFromDb = (data = {}) => {
  const statistics = data.statistics || data;

  if (statistics.totalUsers !== undefined) {
    return {
      totalUsers: formatNumber(statistics.totalUsers),
      totalTeachers: formatNumber(statistics.totalTeachers),
      totalCourses: formatNumber(statistics.totalCourses),
      totalRevenue: formatUsd(statistics.totalRevenue),
    };
  }

  const { users, instructors, courses } = data;

  const activeUsers = toArray(users).filter(isActiveRecord);
  const activeInstructors = toArray(instructors).filter(isActiveRecord);
  const activeCourses = toArray(courses).filter(isActiveRecord);
  const totalRevenue = sumNumbers(activeInstructors, (instructor) => instructor.totalRevenue);

  return {
    totalUsers: formatNumber(activeUsers.length),
    totalTeachers: formatNumber(activeInstructors.length),
    totalCourses: formatNumber(activeCourses.length),
    totalRevenue: formatUsd(totalRevenue),
  };
};

const buildFallbackDashboardDataFromDb = ({ users, instructors, courses }, selectedYear) => {
  const safeUsers = toArray(users);
  const safeInstructors = toArray(instructors);
  const safeCourses = toArray(courses);
  const activeUsers = safeUsers.filter(isActiveRecord);
  const activeInstructors = safeInstructors.filter(isActiveRecord);
  const activeCourses = safeCourses.filter(isActiveRecord);

  return {
    statistics: {
      totalUsers: activeUsers.length,
      totalTeachers: activeInstructors.length,
      totalCourses: activeCourses.length,
      totalRevenue: sumNumbers(activeInstructors, (instructor) => instructor.totalRevenue),
    },
    growthSeries: mapUserGrowthFromDb(safeUsers, getYearFromRange(selectedYear)),
    roleDistribution: mapRoleDistributionFromDb(safeUsers),
    recentUsers: mapRecentUsersFromDb(safeUsers),
    featuredInstructors: mapFeaturedInstructorsFromDb(safeInstructors),
    recentActivity: mapRecentActivityFromDb({
      users: safeUsers,
      instructors: safeInstructors,
      courses: safeCourses,
    }),
  };
};

const useDashboardData = () => {
  const axiosClient = useAxiosPrivate();
  const initialYearRef = useRef(defaultDashboardYear);
  const growthRequestIdRef = useRef(0);
  const [rawData, setRawData] = useState(emptyDashboardData);
  const [growthSeries, setGrowthSeries] = useState([]);
  const [selectedYear, setSelectedYear] = useState(defaultDashboardYear);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [growthError, setGrowthError] = useState("");

  const handleYearChange = async (nextYear) => {
    const requestId = growthRequestIdRef.current + 1;
    growthRequestIdRef.current = requestId;
    setSelectedYear(nextYear);
    setGrowthError("");

    try {
      const dashboard = await getAdminDashboardApi(getYearFromRange(nextYear), axiosClient);

      if (growthRequestIdRef.current !== requestId) return;

      setGrowthSeries(Array.isArray(dashboard?.growthSeries) ? dashboard.growthSeries : []);
    } catch (growthFetchError) {
      if (growthRequestIdRef.current !== requestId) return;

      setGrowthSeries([]);
      setGrowthError(
        growthFetchError?.response?.data?.message
          || "User growth data is not available for the selected year.",
      );
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadDashboardDataFromDb = async () => {
      try {
        setIsLoading(true);
        setError("");

        const dashboard = await getAdminDashboardApi(getYearFromRange(initialYearRef.current), axiosClient);

        if (import.meta.env.DEV) {
          console.debug("[Dashboard] API Response Structure:", {
            hasStatistics: !!dashboard?.statistics,
            hasGrowthSeries: Array.isArray(dashboard?.growthSeries),
            hasRoleDistribution: Array.isArray(dashboard?.roleDistribution),
            hasRecentUsers: Array.isArray(dashboard?.recentUsers),
            hasFeaturedInstructors: Array.isArray(dashboard?.featuredInstructors),
            hasRecentActivity: Array.isArray(dashboard?.recentActivity),
            recentActivityCount: dashboard?.recentActivity?.length || 0,
            sample: dashboard?.recentActivity?.slice(0, 1) || [],
          });
        }

        if (!isMounted) return;

        setRawData({
          statistics: dashboard?.statistics || {},
          growthSeries: [],
          roleDistribution: Array.isArray(dashboard?.roleDistribution) ? dashboard.roleDistribution : [],
          recentUsers: Array.isArray(dashboard?.recentUsers) ? dashboard.recentUsers : [],
          featuredInstructors: Array.isArray(dashboard?.featuredInstructors) ? dashboard.featuredInstructors : [],
          recentActivity: mapRecentActivityFromDashboard({
            recentActivity: dashboard?.recentActivity,
            recentUsers: dashboard?.recentUsers,
            featuredInstructors: dashboard?.featuredInstructors,
            courses: dashboard?.courses,
          }),
        });
        if (growthRequestIdRef.current === 0) {
          setGrowthSeries(Array.isArray(dashboard?.growthSeries) ? dashboard.growthSeries : []);
        }
      } catch (fetchError) {
        if (isMounted) {
          try {
            const [users, instructors, courses] = await Promise.all([
              getAdminUsersApi(axiosClient),
              getAdminInstructorsApi(axiosClient),
              getAdminCoursesApi(axiosClient),
            ]);

            if (!isMounted) return;

            logDashboardFallbackData({ users, instructors, courses });
            const fallbackDashboard = buildFallbackDashboardDataFromDb(
              { users, instructors, courses },
              initialYearRef.current,
            );
            setRawData({
              ...fallbackDashboard,
              growthSeries: [],
            });
            if (growthRequestIdRef.current === 0) {
              setGrowthSeries(fallbackDashboard.growthSeries);
            }
            setError("");
          } catch (fallbackError) {
            // API failed completely: show empty state instead of misleading mock data.
            setRawData(emptyDashboardData);
            setGrowthSeries([]);
            setError(
              fallbackError?.response?.data?.message
                || fetchError?.response?.data?.message
                || "Failed to load dashboard data.",
            );
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDashboardDataFromDb();

    return () => {
      isMounted = false;
    };
  }, [axiosClient]);

  const dashboardData = useMemo(() => {
    return {
      statistics: mapStatisticsFromDb(rawData),
      growthSeries,
      roleDistribution: mapRoleDistributionFromDb(rawData.roleDistribution),
      recentUsers: rawData.recentUsers,
      featuredInstructors: rawData.featuredInstructors,
      recentActivity: rawData.recentActivity,
    };
  }, [growthSeries, rawData]);

  return {
    ...dashboardData,
    isLoading,
    error,
    growthError,
    selectedYear,
    setSelectedYear: handleYearChange,
    yearOptions: dashboardYearOptions,
  };
};

const Dashboard = () => {
  const {
    statistics,
    growthSeries,
    roleDistribution,
    recentUsers,
    featuredInstructors,
    recentActivity,
    isLoading,
    error,
    growthError,
    selectedYear,
    setSelectedYear,
    yearOptions,
  } = useDashboardData();

  return (
    <div className="adminDashboard">
      <div className="adminDashboardContent">
        {error && <div className="adminDashboardError">{error}</div>}

        <Statistics data={statistics} loading={isLoading} />

        <div className="dashboardCharts">
          <div className="growthChartWrapper">
            <GrowthChart
              series={growthSeries}
              yearOptions={yearOptions}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
              emptyMessage={growthError || "No user growth data for the selected year."}
            />
          </div>

          <div className="roleDistributionWrapper">
            <RoleDistribution data={roleDistribution} />
          </div>
        </div>

        <div className="dashboardRows">
          <div className="dashboardRowItem">
            <UserRow users={recentUsers} />
          </div>

          <hr className="dashboardRowSeparator" />

          <div className="dashboardRowItem">
            <TeacherRow
              instructors={featuredInstructors}
              getAvatarValue={getInstructorAvatar}
            />
          </div>

          <hr className="dashboardRowSeparator" />

          <div className="dashboardRowItem">
            <ActivityRow activities={recentActivity} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
