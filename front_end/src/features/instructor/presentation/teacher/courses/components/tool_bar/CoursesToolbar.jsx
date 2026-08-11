import { Plus, Search, X } from "lucide-react";
import { courseRatingFilterOptions, courseStatusFilterOptions } from "../../utils/CourseConfig";

const CoursesToolbar = ({
  activeCategory,
  activeFilter,
  activeRating,
  categoryOptions,
  onCategoryChange,
  onCreateCourse,
  onFilterChange,
  onRatingChange,
  onSearchChange,
  searchTerm,
}) => {
  return (
    <div className="teacher-courses-toolbar">
      <label className="teacher-courses-search">
        <Search size={18} />
        <input
          type="search"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            className="teacher-courses-search__clear"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </label>

      <select value={activeFilter} onChange={(event) => onFilterChange(event.target.value)}>
        {courseStatusFilterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select value={activeCategory} onChange={(event) => onCategoryChange(event.target.value)}>
        {categoryOptions.map((category) => (
          <option key={category} value={category}>
            {category === "ALL" ? "All Categories" : category}
          </option>
        ))}
      </select>

      <select value={activeRating} onChange={(event) => onRatingChange(event.target.value)}>
        {courseRatingFilterOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button className="teacher-courses-create" type="button" onClick={onCreateCourse}>
        <Plus size={20} />
        Create New Course
      </button>
    </div>
  );
};

export default CoursesToolbar;
