import { useState } from "react";
import {
  initialReportFilters,
  reportFilterFields,
} from "./reportFilterData.js";
import AdminHoverSelect from "../../shared/AdminHoverSelect";
import "./ReportFilter.css";

const FilterField = ({ field, value, onChange }) => {
  const inputClassName = field.className ?? "filterInput filterSelect";

  return (
    <div className="filterField">
      <label htmlFor={field.id}>{field.label}</label>
      {field.type === "select" ? (
        <AdminHoverSelect
          id={field.id}
          className={inputClassName}
          options={field.options}
          value={value}
          onChange={(nextValue) =>
            onChange({ target: { name: field.id, value: nextValue } })
          }
          ariaLabel={field.label}
        />
      ) : (
        <input
          id={field.id}
          type={field.type}
          name={field.id}
          value={value}
          onChange={onChange}
          className={inputClassName}
        />
      )}
    </div>
  );
};

const ReportFilter = () => {
  const [filters, setFilters] = useState(initialReportFilters);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const getFilterValue = (fieldId) => filters[fieldId] ?? "";

  return (
    <section className="reportFilterSection">
      <div className="reportFilterContainer">
        <div className="reportFilterTitle">
          <h3>ADVANCED ANALYTICS FILTERS</h3>
          <p>
            Set the analysis scope to preview or download the related analytics
            below.
          </p>
        </div>

        <div className="reportFilterGrid">
          {reportFilterFields.map((field) => (
            <FilterField
              key={field.id}
              field={field}
              value={getFilterValue(field.id)}
              onChange={handleFilterChange}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReportFilter;
