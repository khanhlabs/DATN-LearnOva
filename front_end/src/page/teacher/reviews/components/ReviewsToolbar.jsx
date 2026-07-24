import { Search } from "lucide-react";
import { ratingFilterOptions } from "../reviewsPageData.js";

const ReviewsToolbar = ({
  query,
  onQueryChange,
  ratingFilter,
  onRatingFilterChange,
  courseFilter,
  onCourseFilterChange,
  courseFilterOptions,
}) => (
  <div className="teacher-reviews-header">
    <div className="teacher-reviews-tools">
      <label className="teacher-reviews-search">
        <Search size={20} />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search students or reviews..."
        />
      </label>

      <select
        className="teacher-reviews-filter"
        value={ratingFilter}
        onChange={(event) => onRatingFilterChange(event.target.value)}
      >
        {ratingFilterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        className="teacher-reviews-filter"
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

export default ReviewsToolbar;
