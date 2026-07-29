import { useTranslation } from "react-i18next";

const AuthBanner = ({mode}) => {
    const { t } = useTranslation();

    return (
      <div className="auth-banner" data-mode={mode}>
          <div className="auth-banner-overlay"/>
          <div className="auth-banner-content">
              <div className="dot-grid" aria-hidden="true"/>
              <div className="wave-lines" aria-hidden="true"/>

              <h1 className="auth-banner-title">
                {t("auth.banner.titleLine")}{' '}
                  <em>{t("auth.banner.highlight")}</em>
              </h1>

              <p className="auth-banner-description">
                  {t("auth.banner.description")}
              </p>

              <div className="promo-card">
                  <div className="card-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                  </div>
                  <div>
                      <h3 className="card-title">{t("auth.banner.cardTitle")}</h3>
                      <p className="card-description">{t("auth.banner.cardDescription")}</p>
                  </div>
              </div>

          </div>
      </div>
    );
}

export default AuthBanner;
