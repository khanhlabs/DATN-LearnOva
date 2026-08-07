import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  PencilLine,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import DeleteUserModal from "./modal/DeleteUserModal.jsx";
import EditUserModal from "./modal/EditUserModal.jsx";
import ViewUserModal from "./modal/ViewUserModal.jsx";
import "./UsersList.css";

const tableColumns = ["user", "role", "phone", "visibility", "joinedAt", "actions"];

const pageSize = 10;

const getUserVisibility = (user) =>
  user.isDeleted
    ? { label: "hidden", tone: "deleted" }
    : { label: "active", tone: "visible" };

const UserAvatar = ({ user, className }) => {
  const [failedAvatarSrc, setFailedAvatarSrc] = useState("");
  const avatarSrc = user.avatarUrl || user.avatar || "";
  const shouldShowAvatar = avatarSrc && failedAvatarSrc !== avatarSrc;

  if (shouldShowAvatar) {
    return (
      <img
        className={className}
        src={avatarSrc}
        alt={user.name}
        loading="lazy"
        onError={() => setFailedAvatarSrc(avatarSrc)}
      />
    );
  }

  return (
    <span
      className={`${className} userManagementUserAvatarEmpty`}
      aria-hidden="true"
    />
  );
};

const UsersList = ({
  users = [],
  isLoading = false,
  onUserUpdated = () => {},
  onNotify = () => {},
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
  const visiblePage = Math.min(currentPage, totalPages);

  const visibleUsers = useMemo(() => {
    const startIndex = (visiblePage - 1) * pageSize;
    return users.slice(startIndex, startIndex + pageSize);
  }, [visiblePage, users]);

  const openActionPopup = (action, user) => {
    setSelectedAction(action);
    setSelectedUser(user);
  };

  const closeActionPopup = () => {
    setSelectedAction(null);
    setSelectedUser(null);
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    closeActionPopup();
  };

  return (
    <section className="userManagementUsersSection" aria-label="User List">
      <div className="userManagementUsersCard">
        <div className="userManagementUsersTableHeader" aria-hidden="true">
          {tableColumns.map((column) => (
            <span
              key={column.id}
              className={`userManagementUsersColumn userManagementUsersColumn--${column.id}`}
            >
              {t(`admin.${column}`)}
            </span>
          ))}
        </div>

        <div className="userManagementUsersList">
          {visibleUsers.map((user) => {
            const visibility = getUserVisibility(user);

            return (
              <article key={user.id} className="userManagementUserRow">
                <div className="userManagementUserProfile">
                  <UserAvatar user={user} className="userManagementUserAvatar" />

                  <div className="userManagementUserMeta">
                    <p className="userManagementUserName">{user.name}</p>
                    <div className="userManagementUserEmailWrap">
                      <Mail size={12} aria-hidden="true" />
                      <span className="userManagementUserEmail">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="userManagementUserRoleWrap">
                  <span
                    className={`userManagementUserRole userManagementUserRole--${user.roleTone}`}
                  >
                    <span>{t(`admin.${user.roleFilter === "student" ? "student" : user.roleFilter === "teacher" ? "instructors" : "admin"}`)}</span>
                  </span>
                </div>

                <div className="userManagementUserPhoneWrap">
                  <span className="userManagementUserPhone">
                    <span>{user.phone}</span>
                  </span>
                </div>

                <div className="userManagementUserVisibilityWrap">
                  <span
                    className={`userManagementUserVisibility userManagementUserVisibility--${visibility.tone}`}
                  >
                    <span>{t(`admin.${visibility.label}`)}</span>
                  </span>
                </div>

                <div className="userManagementUserJoinedWrap">
                  <span className="userManagementUserJoined">
                    <span>{user.joinedAt}</span>
                  </span>
                </div>

                <div className="userManagementUserActions">
                  <button
                    type="button"
                    className="userManagementUserActionButton"
                    aria-label={`View ${user.name}`}
                    onClick={() => openActionPopup("View", user)}
                  >
                    <Eye size={14} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="userManagementUserActionButton userManagementUserActionButton--edit"
                    aria-label={`Edit ${user.name}`}
                    onClick={() => openActionPopup("Edit", user)}
                  >
                    <PencilLine size={14} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="userManagementUserActionButton userManagementUserActionButton--danger"
                    aria-label={`Delete ${user.name}`}
                    onClick={() => openActionPopup("Delete", user)}
                    disabled={user.isDeleted}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}

          {!isLoading && users.length === 0 ? (
            <div className="userManagementUsersEmpty">
              {t("admin.noMatchingUsers")}
            </div>
          ) : null}
        </div>

      </div>

      <div className="userManagementUsersFooter">
        <p className="userManagementUsersPageInfo">
          {t("admin.displaying")} {users.length ? (visiblePage - 1) * pageSize + 1 : 0}-
          {Math.min(visiblePage * pageSize, users.length)} out of {users.length}{" "}
          {t("admin.users").toLowerCase()}
        </p>

        <div
          className="userManagementUsersPagination"
          aria-label={t("admin.user")}
        >
          <button
            type="button"
            className="userManagementUsersPageButton userManagementUsersPageButton--nav"
            disabled={visiblePage === 1}
            onClick={() => goToPage(visiblePage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                type="button"
                className={`userManagementUsersPageButton ${visiblePage === page ? "userManagementUsersPageButton--active" : ""}`}
                onClick={() => goToPage(page)}
                aria-label={`Go to page ${page}`}
              >
                {page}
              </button>
            ),
          )}

          <button
            type="button"
            className="userManagementUsersPageButton userManagementUsersPageButton--nav"
            disabled={visiblePage === totalPages}
            onClick={() => goToPage(visiblePage + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {selectedAction === "View" && selectedUser ? (
        <ViewUserModal user={selectedUser} onClose={closeActionPopup} />
      ) : null}

      {selectedAction === "Edit" && selectedUser ? (
        <EditUserModal
          user={selectedUser}
          onClose={closeActionPopup}
          onSaved={async (updatedUser) => {
            await onUserUpdated(updatedUser);
            setSelectedUser(updatedUser);
            closeActionPopup();
          }}
          onNotify={onNotify}
        />
      ) : null}

      {selectedAction === "Delete" && selectedUser ? (
        <DeleteUserModal
          user={selectedUser}
          onClose={closeActionPopup}
          onDeleted={async (deletedUser) => {
            await onUserUpdated(deletedUser);
            setSelectedUser(deletedUser);
            closeActionPopup();
          }}
          onNotify={onNotify}
        />
      ) : null}
    </section>
  );
};

export default UsersList;
