import { Camera } from "lucide-react";
import { useRef } from "react";
import defaultAvatar from "../../../assets/default_avatar.jpg";

const AdminProfileForm = ({
  profileData,
  saveSuccess,
  uploadingAvatar,
  onInputChange,
  onSaveProfile,
  onAvatarChange,
  errors = {},
}) => {
  const fileInputRef = useRef(null);

  return (
    <form onSubmit={onSaveProfile} className="admin-profile-form">
      <div className="admin-profile-avatar-section">
        <div className="admin-profile-avatar-container">
          <div className="admin-profile-avatar-wrapper">
            <img
              src={profileData.avatar || defaultAvatar}
              alt="Admin avatar"
              className="admin-profile-avatar-image"
            />
            <div className="admin-profile-avatar-overlay">
              <span>{uploadingAvatar ? "Uploading..." : "Change photo"}</span>
            </div>
          </div>

          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={onAvatarChange}
            disabled={uploadingAvatar}
          />

          <button
            type="button"
            className="admin-profile-avatar-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            aria-label="Upload avatar"
          >
            <Camera size={18} />
          </button>
        </div>

        <h2 className="admin-profile-name">
          {profileData.fullName || "Admin"}
        </h2>
        <p className="admin-profile-subtitle">Manage your admin account profile</p>
      </div>

      <div className="admin-profile-form-grid">
        <div className="admin-profile-form-group">
          <label htmlFor="admin-fullName">Full name</label>
          <input
            id="admin-fullName"
            type="text"
            value={profileData.fullName || ""}
            onChange={(e) => onInputChange("fullName", e.target.value)}
            className="admin-profile-input"
          />
          {errors.fullName && <div className="admin-profile-error">{errors.fullName}</div>}
        </div>

        <div className="admin-profile-form-group">
          <label htmlFor="admin-email">Email</label>
          <input
            id="admin-email"
            type="email"
            value={profileData.email || ""}
            className="admin-profile-input"
            readOnly
          />
        </div>

        <div className="admin-profile-form-group">
          <label htmlFor="admin-phone">Phone</label>
          <input
            id="admin-phone"
            type="text"
            value={profileData.phone || ""}
            placeholder="Enter phone number"
            onChange={(e) => onInputChange("phone", e.target.value)}
            className="admin-profile-input"
          />
          {errors.phone && <div className="admin-profile-error">{errors.phone}</div>}
        </div>

        <div className="admin-profile-form-group">
          <label htmlFor="admin-dob">Date of birth</label>
          <input
            id="admin-dob"
            type="date"
            value={profileData.dateOfBirth || ""}
            onChange={(e) => onInputChange("dateOfBirth", e.target.value)}
            className="admin-profile-input"
          />
          {errors.dateOfBirth && (
            <div className="admin-profile-error">{errors.dateOfBirth}</div>
          )}
        </div>

        <div className="admin-profile-form-group">
          <label htmlFor="admin-gender">Gender</label>
          <select
            id="admin-gender"
            value={profileData.gender || ""}
            onChange={(e) => onInputChange("gender", e.target.value)}
            className="admin-profile-input"
          >
            <option value="">Not specified</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          {errors.gender && <div className="admin-profile-error">{errors.gender}</div>}
        </div>

        <div className="admin-profile-form-group">
          <label htmlFor="admin-status">Account status</label>
          <input
            id="admin-status"
            type="text"
            value={profileData.status || "Unknown"}
            className="admin-profile-input"
            readOnly
          />
        </div>
      </div>

      <div className="admin-profile-actions">
        <button type="submit" className="admin-profile-save-button">
          {saveSuccess ? "Saved" : "Save changes"}
        </button>
      </div>
    </form>
  );
};

export default AdminProfileForm;
