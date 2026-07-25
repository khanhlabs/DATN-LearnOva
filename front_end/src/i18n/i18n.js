import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import vi from "./locales/vi.json";
import en from "./locales/en.json";

export const LANGUAGE_STORAGE_KEY = "learnova_lang";

const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

i18n.use(initReactI18next).init({
    resources: {
        vi: { translation: vi },
        en: { translation: en },
    },
    lng: storedLanguage || "vi",
    fallbackLng: "vi",
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
