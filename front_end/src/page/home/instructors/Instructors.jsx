import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Instructors.css";
import { getPublicInstructorsApi } from "../../../api/InstructorApi.js";

const AVATAR_COLORS = ["#2563eb", "#4361ee", "#f72585", "#059669", "#d97706"];

function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function Instructors() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [instructors, setInstructors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        getPublicInstructorsApi()
            .then((data) => {
                if (!mounted) return;
                const sorted = (Array.isArray(data) ? data : [])
                    .slice()
                    .sort((a, b) => (b.rating * b.reviewCount) - (a.rating * a.reviewCount))
                    .slice(0, 3);
                setInstructors(sorted);
            })
            .catch(() => {
                if (mounted) setInstructors([]);
            })
            .finally(() => {
                if (mounted) setIsLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, []);

    if (!isLoading && instructors.length === 0) {
        return null;
    }

    return (
        <section className="inst" aria-labelledby="inst-heading">
            <div className="inst__container">
                <div className="inst__header">
                    <span className="section-eyebrow">{t('home.instructors.eyebrow')}</span>
                    <h2 id="inst-heading" className="inst__title">{t('home.instructors.title')}</h2>
                </div>

                <div className="inst__grid">
                    {isLoading ? (
                        <p className="inst__loading">{t('home.instructors.loading')}</p>
                    ) : (
                        instructors.map((inst) => (
                            <article key={inst.instructorId} className="inst__card">
                                {inst.avatar?.trim() ? (
                                    <img src={inst.avatar} alt={inst.fullName} className="inst__avatar-img" />
                                ) : (
                                    <div
                                        className="inst__avatar"
                                        style={{
                                            background: `linear-gradient(135deg, ${getAvatarColor(inst.fullName)}, ${getAvatarColor(inst.fullName)}88)`,
                                        }}
                                        aria-hidden="true"
                                    >
                                        {getInitials(inst.fullName)}
                                    </div>
                                )}
                                <h3 className="inst__name">{inst.fullName}</h3>
                                <p className="inst__role">{inst.headline || t('home.instructors.instructorFallback')}</p>

                                <div className="inst__stats">
                                    <div className="inst__stat">
                                        <strong>{inst.studentCount}</strong>
                                        <span>{t('home.instructors.statStudents')}</span>
                                    </div>
                                    <div className="inst__stat">
                                        <strong>{inst.courseCount}</strong>
                                        <span>{t('home.instructors.statCourses')}</span>
                                    </div>
                                    <div className="inst__stat">
                                        <strong>{inst.rating.toFixed(1)}</strong>
                                        <span>{t('home.instructors.statRating')}</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="inst__cta"
                                    onClick={() => navigate(`/learnova/intructorDetail/${inst.instructorId}`)}
                                >
                                    {t('home.instructors.viewCourses')}
                                </button>
                            </article>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
