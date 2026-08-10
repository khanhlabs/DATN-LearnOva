import React from "react";
import { useTranslation } from "react-i18next";

const AchievementsSection = ({ achievements = [], points = 0, onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="profile-section achievements-section">
      <div className="section-header">
        <div>
          <p className="section-label">{t("profile.achievements.title")}</p>
          <h2>{t("profile.achievements.subtitle")}</h2>
        </div>
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          {t("profile.achievements.back")}
        </button>
      </div>

      <div className="achievement-summary-card">
        <div>
          <p className="summary-label">{t("profile.achievements.currentPoints")}</p>
          <h3>{(points ?? 0).toLocaleString()}</h3>
        </div>
      </div>

      <div className="achievement-grid">
        {achievements.map((achievement) => {
          const Icon = achievement.icon;
          return (
            <div key={achievement.id} className="achievement-card">
              <div className="achievement-icon">
                <Icon size={20} />
              </div>
              <div>
                <h3>{achievement.title}</h3>
                <p>{achievement.description}</p>
                <span
                  className={`achievement-status ${achievement.threshold ? "active" : "locked"}`}
                >
                  {achievement.threshold ? t("profile.achievements.achieved") : t("profile.achievements.locked")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsSection;
