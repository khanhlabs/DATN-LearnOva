import { Search } from "lucide-react";
import { studentStatusFilterOptions } from "../studentsPageData.js";

const StudentsToolbar = ({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  courseFilter,
  onCourseFilterChange,
  courseFilterOptions,
}) => (
  <div className="teacher-students-header">
    <div className="teacher-students-tools">
      <label className="teacher-students-search">
        <Search size={20} />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by name..."
        />
      </label>

      <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}>
        {studentStatusFilterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select value={courseFilter} onChange={(event) => onCourseFilterChange(event.target.value)}>
        {courseFilterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

export default StudentsToolbar;
