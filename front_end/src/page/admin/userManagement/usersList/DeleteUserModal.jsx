import { AlertTriangle, Trash2, X } from "lucide-react";
import { useState } from "react";
import { deleteAdminUserApi } from "../../../../api/admin/AdminUserApi.js";
import "./ViewUserModal.css";

const DeleteUserModal = ({ user, onClose, onDeleted, onNotify = () => {} }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  const handleDelete = async () => {
    if (user.isDeleted) return;

    setIsDeleting(true);
    setError("");

    try {
      await deleteAdminUserApi(user.id);
      onNotify("User deleted successfully", "success");
      onDeleted({
        ...user,
        isDeleted: true,
        status: "Locked",
        statusTone: "locked",
        statusFilter: "locked",
        visibility: "Hidden",
        visibilityTone: "deleted",
        updatedAtRaw: new Date().toISOString(),
      });
    } catch (deleteError) {
      const message =
        deleteError?.response?.data?.message ||
        "Could not delete this user. Please try again.";

      setError(message);
      onNotify("Failed to delete user", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="view-user-overlay" onClick={onClose} role="presentation">
      <div
        className="delete-user-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Delete User"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="delete-user-close"
          onClick={onClose}
          aria-label="Close popup"
        >
          <X size={22} aria-hidden="true" />
        </button>

        <div className="delete-user-icon" aria-hidden="true">
          <AlertTriangle />
        </div>

        <p className="delete-user-eyebrow">DELETE USER</p>
        <h2 className="delete-user-title">Confirm deletion</h2>
        <p className="delete-user-message">
          Are you sure you want to delete <strong>{user.name}</strong>? This will
          mark the account as deleted in the database.
        </p>

        <div className="delete-user-summary">
          <div>
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>
          <div>
            <span>Role</span>
            <strong>{user.role}</strong>
          </div>
        </div>

        {error ? <p className="view-user-error">{error}</p> : null}

        <div className="delete-user-actions">
          <button
            type="button"
            className="view-user-secondary-btn"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="delete-user-confirm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 size={17} aria-hidden="true" />
            {isDeleting ? "Deleting..." : "Delete User"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
