import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./InstructorFilters.css";

const InstructorFilters = ({
  searchTerm = "",
  onSearchChange = () => {},
}) => {
  const { t } = useTranslation();
  return (
    <div className="instructorFilters" aria-label={t("instructorAdmin.title")}>
      <div className="instructorFiltersMain">
        <div className="instructorFiltersSearch">
          <Search size={18} />
          <input
            type="text"
            className="instructorFiltersInput"
            placeholder={t("instructorAdmin.search")}
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default InstructorFilters;
