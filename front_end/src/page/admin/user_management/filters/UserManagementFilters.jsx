import AdminHoverSelect from "../../shared/AdminHoverSelect.jsx";
import { useTranslation } from "react-i18next";
import "./UserManagementFilters.css";

const searchFields = {
  searchPlaceholder: "search",
  roleLabel: "role",
};

const roleOptions = [
  { id: "all", label: "all" },
  { id: "student", label: "students" },
  { id: "teacher", label: "instructors" },
  { id: "admin", label: "administrators" },
];


const UserManagementFilters = ({
  onSearchChange = () => { },
  onRoleChange = () => { },
  onAddUser = () => { },
}) => {
  const { t } = useTranslation();


  return (

    <div
      className="userManagementFilters"
      aria-label="Search and filter users"
    >


      <div className="userManagementFiltersRow">

        <div className="userManagementFiltersControls">
          <input
            type="search"
            className="userManagementFilterSearch"
            placeholder={t(`admin.${searchFields.searchPlaceholder}`)}
            aria-label={t(`admin.${searchFields.searchPlaceholder}`)}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
          />
          <AdminHoverSelect
            className="userManagementFilterSelect"
            ariaLabel={t("admin.role")}
            defaultValue="all"
            options={roleOptions.map((option) => ({ ...option, label: t(`admin.${option.label}`) }))}
            onChange={onRoleChange}
          />
        </div>
        <button
          type="button"
          className="addUserButton"
          onClick={onAddUser}
        >
          + {t("admin.addUser")}
        </button>
      </div>
    </div>
  );
};


export default UserManagementFilters;
