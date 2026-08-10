export const initialReportFilters = {
  startDate: "2026-05-01",
  endDate: "2026-06-04",
  reportType: "All Reports",
  category: "All Categories",
  instructor: "All Instructors",
  course: "All Courses",
  userRole: "All Roles",
};

export const reportFilterFields = [
  {
    id: "startDate",
    label: "Start Date",
    type: "date",
    className: "filterInput filterDateInput",
  },
  {
    id: "endDate",
    label: "End Date",
    type: "date",
    className: "filterInput filterDateInput",
  },
  {
    id: "reportType",
    label: "Report Type",
    type: "select",
    options: [
      "All Reports",
      "Revenue Report",
      "User Report",
      "Course Report",
      "Instructor Report",
    ],
  },
  {
    id: "category",
    label: "Category",
    type: "select",
    options: ["All Categories", "Technology", "Business", "Design", "Language"],
  },
  {
    id: "instructor",
    label: "Instructor",
    type: "select",
    options: ["All Instructors", "Instructor A", "Instructor B", "Instructor C"],
  },
  {
    id: "course",
    label: "Specific Course",
    type: "select",
    options: ["All Courses", "Course 1", "Course 2", "Course 3"],
  },
  {
    id: "userRole",
    label: "User Role",
    type: "select",
    options: ["All Roles", "Administrator", "Instructor", "Student"],
  },
];
