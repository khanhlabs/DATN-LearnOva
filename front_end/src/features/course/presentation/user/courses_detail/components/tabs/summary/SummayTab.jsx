import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    generateLessonSummaryApi,
    getLessonSummaryApi,
} from "../../../../../../infrastructure/api/SummaryApi";
import "./SummaryTab.css";

function SummaryTab({ lessonId }) {
    const { t } = useTranslation();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!lessonId) {
            return undefined;
        }

        let mounted = true;

        const loadSummary = async () => {
            await Promise.resolve();
            if (!mounted) return;

            setLoading(true);
            setSummary(null);
            setError("");

            try {
                const data = await getLessonSummaryApi(lessonId);
                if (mounted) setSummary(data);
            } catch (loadError) {
                if (mounted && loadError.response?.status !== 404) {
                    setError(
                        loadError.response?.data?.message ||
                            t(
                                "courseDetail.summary.loadError",
                                "Unable to load the lesson summary.",
                            ),
                    );
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadSummary();

        return () => {
            mounted = false;
        };
    }, [lessonId, t]);

    const generateSummary = async () => {
        if (!lessonId || loading) return;

        setLoading(true);
        setError("");
        try {
            setSummary(await generateLessonSummaryApi(lessonId));
        } catch (generateError) {
            setError(
                generateError.response?.data?.message ||
                    t(
                        "courseDetail.summary.generateError",
                        "Unable to generate the lesson summary. Please try again.",
                    ),
            );
        } finally {
            setLoading(false);
        }
    };

    if (!lessonId) {
        return (
            <div className="summary-content summary-empty">
                <p>
                    {t(
                        "courseDetail.summary.selectLesson",
                        "Please select a lesson before viewing its summary.",
                    )}
                </p>
            </div>
        );
    }

    if (loading && !summary) {
        return (
            <div className="summary-content summary-empty">
                <p>{t("courseDetail.summary.loading", "Loading summary...")}</p>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="summary-content summary-empty">
                <p>
                    {t(
                        "courseDetail.summary.empty",
                        "No summary has been generated for this lesson yet.",
                    )}
                </p>
                {error && <p className="summary-error">{error}</p>}
                <button
                    className="summary-generate-btn"
                    type="button"
                    onClick={generateSummary}
                    disabled={loading}
                >
                    {t("courseDetail.quiz.summarize", "Summarize knowledge")}
                </button>
            </div>
        );
    }

    return (
        <div className="summary-content">
            <article className="summary-card">
                <div className="summary-card-header">
                    <span className="summary-badge">✦</span>
                    <h4>{t("courseDetail.summary.title", "Lesson summary")}</h4>
                </div>
                <div className="summary-text">{summary.content}</div>
            </article>
            {error && <p className="summary-error">{error}</p>}
        </div>
    );
}

export default SummaryTab;
