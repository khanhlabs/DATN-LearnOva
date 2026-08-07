import "./ActivityRow.css";
import { useTranslation } from "react-i18next";
import i18n from "../../../../i18n/i18n.js";

const ActivityRow = ({ activities = [] }) => {
  const { t } = useTranslation();
  const formatActivityTime = (value) => String(value || "").replace(/^(\d+)([mhd])\s+ago$/i, (_, amount, unit) => {
    const units = { m: "phút", h: "giờ", d: "ngày" };
    if (i18n.language === "en") return `${amount}${unit} ago`;
    return `${amount} ${units[unit.toLowerCase()] || unit} trước`;
  });
  return (
    <section className="activityRowSection" aria-label="Recent Activity">
      <div className="activityRowCard">
        <div className="activityRowCardHeader">
          <div>
            <h3 className="activityRowCardTitle">{t("admin.recentActivity")}</h3>
          </div>
        </div>

        <div className="activityRowList">
          {activities.length === 0 && (
            <p className="activityRowEmpty">{t("admin.activityUnavailable")}</p>
          )}
          {activities.map((activity) => (
            <div key={activity.id} className="activityRowItem">
              <div className="activityRowDot" aria-hidden="true" />

              <div className="activityRowContent">
                <p className="activityRowLabel">{activity.label === "NEW USER" ? t("admin.newUser") : activity.label}</p>
                <p className="activityRowTitle">{activity.title}</p>
              </div>

              <span className="activityRowTime">{formatActivityTime(activity.time)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ActivityRow;
