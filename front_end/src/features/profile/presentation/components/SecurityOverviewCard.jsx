import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

const CHECK_KEYS = [
  "profile.security.checkStrongPassword",
  "profile.security.checkVerifiedEmail",
  "profile.security.checkVerifiedPhone",
];

const SecurityOverviewCard = ({ overview }) => {
  const { t } = useTranslation();

  return (
    <section className="security-overview-card">
      <div className="security-shield-wrap">
        <div className="security-shield-circle">
          <ShieldCheck size={42} />
        </div>
      </div>

      <div className="security-overview-copy">
        <h2>{t("profile.security.overviewTitle")}</h2>
        <p>{t("profile.security.overviewDescription")}</p>

        <div className="security-strength-bars">
          {overview.progressSegments.map((isActive, index) => (
            <span className={isActive ? "active" : ""} key={`bar-${index}`} />
          ))}
        </div>

        <p className="security-level">
          {t("profile.security.levelLabel")} <strong>{t("profile.security.levelValue")}</strong>
        </p>
      </div>

      <div className="security-check-list">
        {CHECK_KEYS.map((key) => (
          <div key={key}>
            <CheckCircle2 size={16} fill="currentColor" />
            <span>{t(key)}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SecurityOverviewCard;
