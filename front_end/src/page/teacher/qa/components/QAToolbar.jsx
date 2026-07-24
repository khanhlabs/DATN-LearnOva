import { Search } from "lucide-react";

const statusOptions = [
  { label: "All Questions", value: "all" },
  { label: "Unsolved", value: "unsolved" },
  { label: "Solved", value: "solved" },
  { label: "Pinned", value: "pinned" },
];

const QAToolbar = ({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  courseFilter,
  onCourseFilterChange,
  courseFilterOptions,
}) => (
  <div className="teacher-qa-header">
    <div className="teacher-qa-tools">
      <label className="teacher-qa-search">
        <Search size={20} />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search..."
        />
      </label>

      <select
        className="teacher-qa-filter"
        value={statusFilter}
        onChange={(event) => onStatusFilterChange(event.target.value)}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        className="teacher-qa-filter"
        value={courseFilter}
        onChange={(event) => onCourseFilterChange(event.target.value)}
      >
        {courseFilterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

export default QAToolbar;
