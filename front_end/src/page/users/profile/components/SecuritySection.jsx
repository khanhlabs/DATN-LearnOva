import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import SecurityContactCard from "./SecurityContactCard.jsx";
import SecurityOverviewCard from "./SecurityOverviewCard.jsx";
import SecurityPasswordCard from "./SecurityPasswordCard.jsx";
import { changePasswordApi } from "../../../../api/users/UserApi.js";
import { toast } from "react-toastify";

const initialPasswordValues = PASSWORD_FIELDS.reduce(
    (fields, field) => ({ ...fields, [field.id]: "" }),
    {},
);

const SecuritySection = ({ profileData = {} }) => {
  const { t } = useTranslation();
  const [passwordValues, setPasswordValues] = useState(initialPasswordValues);
  const [status, setStatus] = useState(null);

  const contactRows = useMemo(
      () => getSecurityContactRows(profileData),
      [profileData],
  );

  const handlePasswordChange = (fieldId, value) => {
    setPasswordValues((current) => ({
      ...current,
      [fieldId]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    // validate frontend
    const hasEmpty = PASSWORD_FIELDS.some(
        (f) => !passwordValues[f.id]
    );

    if (hasEmpty) {
      setStatus({
        type: "error",
        message: t("profile.security.fillRequiredFields"),
      });
      return;
    }

    if (passwordValues.newPassword.length < 8) {
      setStatus({
        type: "error",
        message: t("profile.security.passwordTooShort"),
      });
      return;
    }

    if (passwordValues.newPassword !== passwordValues.confirmPassword) {
      setStatus({
        type: "error",
        message: t("profile.security.passwordMismatch"),
      });
      return;
    }

    try {
      await changePasswordApi(passwordValues);

      setStatus({
        type: "success",
        message: t("profile.security.passwordChangeSuccess"),
      });

      toast.success(t("profile.security.passwordChangeSuccess"));

      setPasswordValues(initialPasswordValues);
    } catch (err) {
      const msg =
          err?.response?.data?.message || t("profile.security.passwordChangeError");

      setStatus({
        type: "error",
        message: msg,
      });

      toast.error(msg);
    }
  };

  return (
      <div className="security-page">
        <SecurityOverviewCard overview={SECURITY_OVERVIEW} />

        <div className="security-main-grid">
          <SecurityPasswordCard
              card={SECURITY_CARD_TITLES.password}
              fields={PASSWORD_FIELDS}
              values={passwordValues}
              status={status}
              onChange={handlePasswordChange}
              onSubmit={handleSubmit}
          />

          <SecurityContactCard
              card={SECURITY_CARD_TITLES.contact}
              rows={contactRows}
          />
        </div>
      </div>
  );
};

export default SecuritySection;