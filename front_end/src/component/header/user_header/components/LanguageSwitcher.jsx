import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { LANGUAGE_STORAGE_KEY } from "../../../../i18n/i18n.js";
import "./LanguageSwitcher.css";

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const currentLanguage = i18n.language === "en" ? "en" : "vi";

    const toggleLanguage = () => {
        const nextLanguage = currentLanguage === "vi" ? "en" : "vi";
        i18n.changeLanguage(nextLanguage);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    };

    return (
        <button
            type="button"
            className="lang-switch-btn"
            onClick={toggleLanguage}
            aria-label="Switch language"
        >
            <Globe size={20} />
            <span className="lang-switch-btn-label">
                {currentLanguage === "vi" ? "VI" : "EN"}
            </span>
        </button>
    );
};

export default LanguageSwitcher;
