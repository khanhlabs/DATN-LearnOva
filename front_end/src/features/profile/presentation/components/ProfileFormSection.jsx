import { Camera } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import defaultAvatar from "../../../../assets/image/DefaultAvatar.jpg";

function ProfileFormSection({
  profileData,
  saveSuccess,
  onInputChange,
  onSaveProfile,
  onAvatarChange,
  errors = {},
}) {
  const { t } = useTranslation();
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
                <span>{t("profile.form.changeAvatar")}</span>
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
            {profileData.fullName || t("profile.form.unknownUser")}
          </h2>

          <p className="profile-subtitle">
            {t("profile.form.subtitle")}
          </p>
        </div>

        {/* FORM GRID */}
        <div className="form-grid">

          {/* FULL NAME */}
          <div className="form-group">
            <label>{t("profile.form.fullName")}</label>
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
            <label>{t("profile.form.email")}</label>
            <input
                type="email"
                value={profileData.email || ""}
                className="form-input"
                readOnly
            />
          </div>

          {/* PHONE */}
          <div className="form-group">
            <label>{t("profile.form.phone")}</label>
            <input
                type="text"
                value={profileData.phone || ""}
                placeholder={t("profile.form.phonePlaceholder")}
                onChange={(e) => onInputChange("phone", e.target.value)}
                className="form-input"
            />
            {errors?.phone && (
                <div className="error-text">{errors.phone}</div>
            )}
          </div>

          {/* DATE OF BIRTH */}
          <div className="form-group">
            <label>{t("profile.form.dateOfBirth")}</label>
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
            <label>{t("profile.form.gender")}</label>
            <select
                value={profileData.gender || ""}
                onChange={(e) => onInputChange("gender", e.target.value)}
                className="form-input"
            >
              <option value="">{t("profile.form.genderNotSpecified")}</option>
              <option value="Male">{t("profile.form.genderMale")}</option>
              <option value="Female">{t("profile.form.genderFemale")}</option>
              <option value="Other">{t("profile.form.genderOther")}</option>
            </select>

            {errors?.gender && (
                <div className="error-text">{errors.gender}</div>
            )}
          </div>

          {/* STATUS */}
          <div className="form-group">
            <label>{t("profile.form.accountStatus")}</label>
            <input
                type="text"
                value={profileData.status || t("profile.form.statusUnknown")}
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
            {t("profile.form.cancel")}
          </button>

          <button
              type="submit"
              className="save-button"
          >
            {t("profile.form.saveChanges")}
          </button>
        </div>

      </form>
  );
}

export default ProfileFormSection;
