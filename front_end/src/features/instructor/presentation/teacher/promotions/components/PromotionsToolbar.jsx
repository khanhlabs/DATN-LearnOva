import { Search, X } from "lucide-react";
import { promotionStatusFilterOptions } from "../utils/PromotionConfig";

const PromotionsToolbar = ({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
}) => (
  <div className="teacher-promotions-toolbar" aria-label="Promotion filters">
    <label className="teacher-promotions-search">
      <Search size={16} />
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search courses..."
      />
      {query && (
        <button
          type="button"
          className="teacher-promotions-search__clear"
          onClick={() => onQueryChange("")}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </label>

    <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}>
      {promotionStatusFilterOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>

    <select value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value)}>
      {categoryOptions.map((category) => (
        <option key={category} value={category}>
          {category === "ALL" ? "All Categories" : category}
        </option>
      ))}
    </select>
  </div>
);

export default PromotionsToolbar;
