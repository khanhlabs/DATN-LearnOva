import "./UserRow";
import { useTranslation } from "react-i18next";

// User fields guaranteed from Dashboard.mapRecentUsersFromDb():
// id, name, email, and normalized role all include safe fallbacks.
const UserRowItem = ({ user }) => {
  return (
    <div className="userRowItem">
      <div className="userRowItemUser">

        <div className="userRowItemMeta">
          <p className="userRowItemName">{user.name}</p>
          <p className="userRowItemEmail">{user.email}</p>
        </div>
      </div>

      <div className="userRowItemRoleWrap">
        <span className="userRowItemRole">{user.role}</span>
      </div>
    </div>
  );
};

const UserRow = ({ users = [] }) => {
  const { t } = useTranslation();
  return (
    <section className="userRowSection">
      <div className="userRowCard userRowRecentUsersCard">
        <div className="userRowCardHeader">
          <div>
            <h3 className="userRowCardTitle">{t("admin.recentUsers")}</h3>
          </div>
        </div>

        <div className="userRowTableHeader" aria-hidden="true">
          <span className="userRowTableHeaderName">{t("admin.user")}</span>
          <span className="userRowTableHeaderRole">{t("admin.role")}</span>
        </div>

        <div className="userRowList">
          {users.length === 0 && <p className="userRowEmpty">{t("admin.noRecentUsers")}</p>}
          {users.map((user) => (
            <UserRowItem key={user.id} user={user} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default UserRow;
