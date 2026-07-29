import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { adminNotifySuccess } from "../../../api/NotificationApi.js";
import { createAdminUserApi, getAdminUsersApi } from "../../../api/admin/AdminUserApi.js";
import { getFileUrl } from "../../../api/PublicCourseApi.js";
import { useAxiosPrivate } from "../../../hook/UseAxiosPrivate.js";  // ← Thêm import này
import UserManagementStats from "./statistics/UserManagementStats";
import UserManagementFilters from "./filters/UserManagementFilters";
import UsersList from "./usersList/UsersList";
import AddUserModal from "./filters/AddUserModal";
import "./UserManagement.css";

const formatDate = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const normalizeRole = (role) => {
  const normalizedRole = String(role ?? "USER").replace("ROLE_", "").toUpperCase();
  if (normalizedRole === "ADMIN") return { label: "Admin", tone: "admin", filter: "admin" };
  if (["TEACHER", "INSTRUCTOR"].includes(normalizedRole)) return { label: "Instructor", tone: "teacher", filter: "teacher" };
  return { label: "Student", tone: "student", filter: "student" };
};

const normalizeStatus = (user) => {
  const rawStatus = String(user.status ?? "").toLowerCase();

  const isLocked =
    Boolean(user.isDeleted) ||
    rawStatus === "inactive" ||
    rawStatus === "locked";

  if (isLocked) {
    return { label: "Locked", tone: "locked", filter: "locked" };
  }

  if (rawStatus === "pending") {
    return { label: "Pending", tone: "pending", filter: "pending" };
  }

  return { label: "Active", tone: "active", filter: "active" };
};

const normalizeVisibility = (isDeleted) =>
  isDeleted
    ? { label: "Hidden", tone: "deleted" }
    : { label: "Active", tone: "visible" };

const getDisplayName = (user) =>
  user.fullName?.trim() || user.email?.split("@")[0] || "Unknown user";

const API_URL = import.meta.env.VITE_API_URL || "";
const API_ORIGIN = API_URL.replace(/\/api\/learnova\/?$/, "");

const cleanMediaValue = (value) => {
  const mediaValue = String(value ?? "").trim();
  const normalizedValue = mediaValue.toLowerCase();

  if (
    !mediaValue ||
    normalizedValue === "null" ||
    normalizedValue === "[null]" ||
    normalizedValue === "undefined" ||
    normalizedValue === "n/a"
  ) {
    return "";
  }

  return mediaValue;
};

const isResolvedMediaUrl = (value) =>
  /^(https?:)?\/\//i.test(value) || /^(data|blob):/i.test(value);

const getBackendMediaUrl = (value) => {
  if (!value || isResolvedMediaUrl(value) || !API_ORIGIN) return value;

  return `${API_ORIGIN}/${String(value).replace(/^\/+/, "")}`;
};

const resolveMediaUrl = async (value) => {
  const mediaValue = cleanMediaValue(value);

  if (!mediaValue || isResolvedMediaUrl(mediaValue)) return mediaValue;

  try {
    return await getFileUrl(mediaValue);
  } catch {
    return getBackendMediaUrl(mediaValue);
  }
};

const normalizeUser = (user) => {
  const role = normalizeRole(user.role);
  const status = normalizeStatus(user);
  const name = getDisplayName(user);
  const joinedAt = user.createdAt ?? user.joinedAt;
  const isDeleted = Boolean(user.isDeleted);
  const visibility = normalizeVisibility(isDeleted);
  const avatar = cleanMediaValue(user.avatar);
  const coverImage = cleanMediaValue(user.coverImage ?? user.cover_image);

  return {
    id: user.id,
    fullName: name,
    name,
    email: user.email ?? "N/A",
    phone: user.phone ?? "N/A",
    avatar,
    coverImage,
    dateOfBirthRaw: user.dateOfBirth,
    dateOfBirth: formatDate(user.dateOfBirth),
    gender: user.gender ?? "N/A",
    role: role.label,
    roleTone: role.tone,
    roleFilter: role.filter,
    status: status.label,
    statusTone: status.tone,
    statusFilter: status.filter,
    visibility: visibility.label,
    visibilityTone: visibility.tone,
    joinedAtRaw: joinedAt,
    joinedAt: formatDate(joinedAt),
    isDeleted,
    updatedAtRaw: user.updatedAt,
    updatedAt: formatDate(user.updatedAt),
  };
};

const normalizeUserWithMedia = async (user) => {
  const normalizedUser = normalizeUser(user);
  const [avatarUrl, coverImageUrl] = await Promise.all([
    resolveMediaUrl(normalizedUser.avatar),
    resolveMediaUrl(normalizedUser.coverImage),
  ]);

  return {
    ...normalizedUser,
    avatarUrl,
    coverImageUrl,
  };
};

const UserManagement = () => {
  const axiosPrivate = useAxiosPrivate();  
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const showNotification = useCallback((message, type = "success", duration) => {
    if (type === "error") {
      toast.error(message, { autoClose: duration ?? 5000 });
      return;
    }
    void adminNotifySuccess(message, { title: "User management" });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        setIsLoading(true);

        const response = await getAdminUsersApi();

        const normalizedUsers = Array.isArray(response)
          ? await Promise.all(response.map(normalizeUserWithMedia))
          : [];

        if (isMounted) {
          setUsers(normalizedUsers);
        }
      } catch (fetchError) {
        if (isMounted) {
          const message =
            fetchError?.response?.data?.message ||
            "Failed to load users from server.";

          showNotification(message, "error");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [showNotification]);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !keyword ||
        [user.name, user.email, user.phone, user.role, user.status]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      const matchesRole =
        roleFilter === "all" || user.roleFilter === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [roleFilter, searchTerm, users]);

  const handleUserUpdated = async (updatedUser) => {
    const normalizedUpdatedUser = await normalizeUserWithMedia(updatedUser);

    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === normalizedUpdatedUser.id
          ? { ...user, ...normalizedUpdatedUser }
          : user
      )
    );
  };

  const handleCreateUser = async (userData) => {
    const createdUser = await createAdminUserApi(userData, axiosPrivate);  // ← Pass axiosPrivate
    const normalizedCreatedUser = await normalizeUserWithMedia(createdUser);
    setUsers((currentUsers) => [...currentUsers, normalizedCreatedUser]);
    setShowAddUserModal(false);
  };

  return (
    <section className="userManagementPage" aria-label="User management">
      <div className="userManagementContent">
        <UserManagementStats users={users} isLoading={isLoading} />

        <UserManagementFilters
          onSearchChange={setSearchTerm}
          onRoleChange={setRoleFilter}
          onAddUser={() => setShowAddUserModal(true)}
        />

        <UsersList
          users={filteredUsers}
          isLoading={isLoading}
          onUserUpdated={handleUserUpdated}
          onNotify={showNotification}
        />

        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onSubmit={handleCreateUser}
          onNotify={showNotification}
        />
      </div>
    </section>
  );
};

export default UserManagement;
