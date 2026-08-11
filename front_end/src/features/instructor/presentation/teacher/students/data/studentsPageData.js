export const studentTableColumns = [
  "Name",
  "Phone number",
  "Courses enrolled",
  "Join date",
  "Average progress",
  "Status",
  "Action",
];

export const STUDENT_STATUS_LABELS = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export const studentStatusFilterOptions = [
  { label: "All statuses", value: "ALL" },
  { label: "Not Started", value: "NOT_STARTED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
];
