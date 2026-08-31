import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
    getLessonSummaryApi,
} from "../../../../../../infrastructure/api/SummaryApi";
import { getAiGenerationStatusApi } from "../../../../../../infrastructure/api/AiGenerationApi";
import "./SummaryTab.css";

const getErrorMessage = (requestError, fallbackMessage) => {
    const payload = requestError.response?.data;

    if (typeof payload === "string" && payload.trim()) return payload;
    if (payload?.message) return payload.message;
    if (payload?.detail) return payload.detail;
    if (payload?.error) return payload.error;

    return requestError.message || fallbackMessage;
};

function SummaryTab({ lessonId }) {
    const { t } = useTranslation();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [generationStatus, setGenerationStatus] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

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
                if (mounted && loadError.response?.status === 404) {
                    try {
                        const jobs = await getAiGenerationStatusApi(lessonId);
                        const summaryJob = jobs.find((job) => job.type === "SUMMARY");
                        if (mounted) setGenerationStatus(summaryJob?.status || "QUEUED");
                    } catch {
                        if (mounted) setGenerationStatus("QUEUED");
                    }
                    return;
                }
                if (mounted) {
                    setError(getErrorMessage(
                        loadError,
                        t(
                            "courseDetail.summary.loadError",
                            "Unable to load the lesson summary.",
                        ),
                    ));
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadSummary();

        return () => {
            mounted = false;
        };
    }, [lessonId, t, refreshKey]);

    useEffect(() => {
        if (!["QUEUED", "PROCESSING"].includes(generationStatus)) return undefined;
        const timer = window.setTimeout(() => setRefreshKey((value) => value + 1), 5000);
        return () => window.clearTimeout(timer);
    }, [generationStatus]);

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
                    {generationStatus === "FAILED"
                        ? t("courseDetail.summary.unavailable", "The summary is temporarily unavailable.")
                        : t("courseDetail.summary.preparing", "The summary is being prepared automatically.")}
                </p>
                {error && <p className="summary-error">{error}</p>}
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
