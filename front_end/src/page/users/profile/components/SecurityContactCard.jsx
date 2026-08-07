import { ChevronRight, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

const ROW_LABEL_KEYS = {
  email: "profile.security.contactEmail",
  phone: "profile.security.contactPhone",
  changeContact: "profile.security.contactChange",
};

const SecurityContactCard = ({ rows }) => {
  const { t } = useTranslation();

  return (
    <section className="security-card security-contact-card">
      <div className="security-card-heading">
        <span>
          <Mail size={22} />
        </span>
        <div>
          <h3>{t("profile.security.contactCardTitle")}</h3>
          <p>{t("profile.security.contactCardDescription")}</p>
        </div>
      </div>

      <div className="security-contact-list">
        {rows.map((row) => (
          <button type="button" key={row.id}>
            <div>
              <strong>{t(ROW_LABEL_KEYS[row.id])}</strong>
              {row.value && <p>{row.value}</p>}
            </div>

            <ChevronRight size={18} />
          </button>
        ))}
      </div>
    </section>
  );
};

export default SecurityContactCard;
