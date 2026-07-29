import { useTranslation } from 'react-i18next';
import { LANGUAGE_STORAGE_KEY } from '../../i18n/i18n.js';
import './footer.css';
import Logo from '../../assets/Logo.png'
import LogoText from '../../assets/LogoText.png'
import github from '../../assets/iconSvg/github-svgrepo-com.svg'
import linkedin from '../../assets/iconSvg/linkedin-svgrepo-com.svg'
import facebook from '../../assets/iconSvg/facebook-svgrepo-com.svg'
import instagram from '../../assets/iconSvg/instagram-svgrepo-com.svg'


export default function Footer() {
    const { t, i18n } = useTranslation();

    const handleLanguageChange = (e) => {
        const nextLanguage = e.target.value;
        i18n.changeLanguage(nextLanguage);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    };

    return (
        <footer className="footer" aria-label="Site footer">

            {/* Top grid — logo + nav columns */}
            <div className="footer__top">
                {/* Brand column */}
                <div className="footer__brand">
                    <div className="footer__logo">
                        <div className="footer__logo-icon">
                            <img src={Logo} alt="LearnOva Logo" />
                        </div>
                        <span className="footer__logo-text"><img src={LogoText} alt="LearnOva Text" /></span>
                    </div>

                    <p className="footer__tagline">
                        {t('footer.tagline')}
                    </p>

                    <div className="footer__socials">
                        <a href="https://github.com/khanh030106/DATN-LearnOva" className="footer__social-btn" aria-label="GitHub">
                            <img src={github} alt="GitHub" />
                        </a>
                        <a href="https://www.linkedin.com/in/khanh-pham-gia-281616352/" className="footer__social-btn" aria-label="LinkedIn">
                            <img src={linkedin} alt="LinkedIn" />
                        </a>
                        <a href="https://www.facebook.com/pham.gia.khanh.589369" className="footer__social-btn" aria-label="Facebook">
                            <img src={facebook} alt="Facebook" />
                        </a>
                        {/* Instagram */}
                        <a href="https://www.instagram.com/kahn.cules_/" className="footer__social-btn" aria-label="Instagram">
                            <img src={instagram} alt="Instagram" />
                        </a>
                    </div>
                </div>

                {/* Company column */}
                <div className="footer__col">
                    <span className="footer__col-heading">{t('footer.company')}</span>
                    <nav className="footer__nav">
                        <a href="#" className="footer__link">{t('footer.aboutUs')}</a>
                        <a href="#" className="footer__link">{t('footer.careers')}</a>
                        <a href="#" className="footer__link">{t('footer.blog')}</a>
                        <a href="#" className="footer__link">{t('footer.press')}</a>
                        <a href="#" className="footer__link">{t('footer.investors')}</a>
                    </nav>
                </div>

                {/* Support column */}
                <div className="footer__col">
                    <span className="footer__col-heading">{t('footer.support')}</span>
                    <nav className="footer__nav">
                        <a href="#" className="footer__link">{t('footer.helpCenter')}</a>
                        <a href="#" className="footer__link">{t('footer.contactUs')}</a>
                        <a href="#" className="footer__link">{t('footer.faqs')}</a>
                        <a href="#" className="footer__link">{t('footer.systemStatus')}</a>
                        <a href="#" className="footer__link">{t('footer.accessibility')}</a>
                    </nav>
                </div>

                {/* Language + trust badge column */}
                <div className="footer__col">
                    <span className="footer__col-heading">Language</span>

                    <div className="footer__lang-wrap">
                        <span className="footer__lang-globe">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M2 12h20M12 2c-4 4-4 16 0 0s4-16 0 0" />
                            </svg>
                        </span>
                        <select className="footer__lang-select" value={i18n.language} onChange={handleLanguageChange}>
                            <option value="en">English</option>
                            <option value="vi">Tiếng Việt</option>
                        </select>
                        <span className="footer__lang-chevron">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    </div>

                    <div className="footer__trust">
                        <div className="footer__trust-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <div>
                            <p className="footer__trust-title">{t('footer.trustedTitle')}</p>
                            <p className="footer__trust-sub">{t('footer.trustedSub')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="footer__divider-wrap">
                <div className="footer__divider" />
            </div>

            {/* Bottom bar */}
            <div className="footer__bottom">
                <p className="footer__copy">{t('footer.copyright')}</p>
                <nav className="footer__legal">
                    <a href="#" className="footer__legal-link">{t('footer.privacyPolicy')}</a>
                    <span className="footer__legal-dot">·</span>
                    <a href="#" className="footer__legal-link">{t('footer.termsOfService')}</a>
                    <span className="footer__legal-dot">·</span>
                    <a href="#" className="footer__legal-link">{t('footer.cookiePolicy')}</a>
                    <span className="footer__legal-dot">·</span>
                    <a href="#" className="footer__legal-link">{t('footer.sitemap')}</a>
                </nav>
            </div>
        </footer>
    );
}
