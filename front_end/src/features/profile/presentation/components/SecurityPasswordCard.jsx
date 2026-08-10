import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

const FIELD_LABEL_KEYS = {
  currentPassword: "profile.security.currentPassword",
  newPassword: "profile.security.newPassword",
  confirmPassword: "profile.security.confirmPassword",
};

const SecurityPasswordCard = ({
  fields,
  values,
  status,
  onChange,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [visibleFields, setVisibleFields] = useState({});

  const togglePasswordVisibility = (fieldId) => {
    setVisibleFields((current) => ({
      ...current,
      [fieldId]: !current[fieldId],
    }));
  };

  return (
    <section className="security-card security-password-card">
      <div className="security-card-heading">
        <span>
          <Lock size={22} />
        </span>
        <div>
          <h3>{t("profile.security.passwordCardTitle")}</h3>
          <p>{t("profile.security.passwordCardDescription")}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="security-password-form">
        {fields.map((field) => {
          const isVisible = Boolean(visibleFields[field.id]);
          const fieldLabel = t(FIELD_LABEL_KEYS[field.id]);

          return (
            <label key={field.id}>
              <span>{fieldLabel}</span>
              <div className="security-input-wrap">
                <input
                  type={isVisible ? "text" : "password"}
                  value={values[field.id] || ""}
                  onChange={(event) => onChange(field.id, event.target.value)}
                  placeholder={field.placeholder}
                />
                <button
                  type="button"
                  aria-label={`${isVisible ? t("profile.security.hide") : t("profile.security.show")} ${fieldLabel}`}
                  onClick={() => togglePasswordVisibility(field.id)}
                >
                  {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {field.strength && (
                <div className="security-password-strength">
                  <span />
                  <strong>{t("profile.security.passwordStrength")}</strong>
                </div>
              )}

              {field.hint && <small>{t("profile.security.passwordHint")}</small>}
            </label>
          );
        })}

        {status && (
          <p className={`security-form-status ${status.type}`}>
            {status.message}
          </p>
        )}

        <button className="security-primary-button" type="submit">
          {t("profile.security.updatePassword")}
        </button>
      </form>
    </section>
  );
};

export default SecurityPasswordCard;
