import { Camera } from "lucide-react";
import { useRef } from "react";
import defaultAvatar from "../../../../../assets/default_avatar.jpg";




  function ProfileFormSection({
                                profileData,
                                saveSuccess,
                                onInputChange,
                                onSaveProfile,
                                onAvatarChange,
                                errors = {}
                              }) {
    const fileInputRef = useRef(null);

  return (
      <form onSubmit={onSaveProfile} className="profile-form">

        {/* AVATAR */}
        <div className="avatar-section">
          <div className="avatar-container">
            <div className="avatar-wrapper">
              <img
                  src={profileData.avatar || defaultAvatar}
                  alt="Profile Large"
                  className="avatar-large"
              />

              <div className="avatar-overlay">
                <span>Change</span>
              </div>
            </div>

            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={onAvatarChange}
            />

            <button
                type="button"
                className="avatar-button"
                onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={18} />
            </button>
          </div>

          <h2 className="profile-name">
            {profileData.fullName || "Unknown User"}
          </h2>

          <p className="profile-subtitle">
            Honor Student • Joined in 2026
          </p>
        </div>

        {/* FORM GRID */}
        <div className="form-grid">

          {/* FULL NAME */}
          <div className="form-group">
            <label>Full Name</label>
            <input
                type="text"
                value={profileData.fullName || ""}
                onChange={(e) => onInputChange("fullName", e.target.value)}
                className="form-input"
            />
            {errors?.fullName && (
                <div className="error-text">{errors.fullName}</div>
            )}
          </div>

          {/* EMAIL (READ ONLY) */}
          <div className="form-group">
            <label>Email Address</label>
            <input
                type="email"
                value={profileData.email || ""}
                className="form-input"
                readOnly
            />
          </div>

          {/* PHONE */}
          <div className="form-group">
            <label>Phone Number</label>
            <input
                type="text"
                value={profileData.phone || ""}
                placeholder="Not provided"
                onChange={(e) => onInputChange("phone", e.target.value)}
                className="form-input"
            />
            {errors?.phone && (
                <div className="error-text">{errors.phone}</div>
            )}
          </div>

          {/* DATE OF BIRTH */}
          <div className="form-group">
            <label>Date of Birth</label>
            <input
                type="date"
                value={profileData.dateOfBirth || ""}
                onChange={(e) => onInputChange("dateOfBirth", e.target.value)}
                className="form-input"
            />
            {errors?.dateOfBirth && (
                <div className="error-text">{errors.dateOfBirth}</div>
            )}
          </div>

          {/* GENDER */}
          <div className="form-group">
            <label>Gender</label>
            <select
                value={profileData.gender || ""}
                onChange={(e) => onInputChange("gender", e.target.value)}
                className="form-input"
            >
              <option value="">Not specified</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            {errors?.gender && (
                <div className="error-text">{errors.gender}</div>
            )}
          </div>

          {/* STATUS */}
          <div className="form-group">
            <label>Account Status</label>
            <input
                type="text"
                value={profileData.status || "Unknown"}
                className="form-input"
                readOnly
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="form-actions">
          <button
              type="button"
              className="cancel-button"
          >
            Cancel
          </button>

          <button
              type="submit"
              className="save-button"
          >
            Save Changes
          </button>
        </div>

      </form>
  );
};

export default ProfileFormSection;
