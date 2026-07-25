import { useTranslation } from "react-i18next";

import "../css/QuizPage.css";

function SummaryTab() {
    const { t } = useTranslation();

    return (
        <button className="generate-quiz">
            {t("courseDetail.quiz.summarize")}
        </button>
    );
}

export default SummaryTab;