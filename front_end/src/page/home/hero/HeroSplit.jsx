import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './HeroSplit.css';
import { getFeaturedCourses, getPlatformStats, getFileUrl } from '../../../api/PublicCourseApi.js';

const formatCompact = (num) => {
    const value = Number(num || 0);
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M+`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K+`;
    return `${value}+`;
};

const formatHours = (seconds) => {
    const hours = Math.round(Number(seconds || 0) / 3600);
    return hours > 0 ? `${hours} hours` : null;
};

export default function HeroSplit() {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [featuredCourses, setFeaturedCourses] = useState([]);
    const [thumbnailUrl, setThumbnailUrl] = useState(null);

    useEffect(() => {
        let mounted = true;

        getPlatformStats()
            .then((data) => mounted && setStats(data))
            .catch(() => {});

        getFeaturedCourses()
            .then((data) => mounted && setFeaturedCourses(Array.isArray(data) ? data : []))
            .catch(() => {});

        return () => {
            mounted = false;
        };
    }, []);

    const primaryCourse = featuredCourses[0];
    const secondaryCourse = featuredCourses[1];

    useEffect(() => {
        if (!primaryCourse?.thumbnailKey) {
            setThumbnailUrl(null);
            return;
        }

        getFileUrl(primaryCourse.thumbnailKey)
            .then(setThumbnailUrl)
            .catch(() => setThumbnailUrl(null));
    }, [primaryCourse]);

    const handleSearch = (e) => {
        e.preventDefault();
        const trimmed = search.trim();
        navigate(trimmed ? `/learnova/courses?search=${encodeURIComponent(trimmed)}` : '/learnova/courses');
    };

    return (
        <section className="hero">
            <div className="hero__glow hero__glow--1" aria-hidden="true" />
            <div className="hero__glow hero__glow--2" aria-hidden="true" />

            <div className="hero__inner">
                {/* ── Left column ── */}
                <div className="hero__left">
                    <div className="hero__badge">
                        <span className="hero__badge-dot" aria-hidden="true" />
                        {stats ? t('home.hero.badgeWithCount', { count: formatCompact(stats.totalCourses) }) : t('home.hero.badgeDefault')}
                    </div>

                    <h1 className="hero__headline">
                        {t('home.hero.headlineLine1')}<br />
                        <span className="hero__gradient-text">{t('home.hero.headlineLine2')}</span><br />
                        {t('home.hero.headlineLine3')}
                    </h1>

                    <p className="hero__copy">
                        {t('home.hero.copy')}
                    </p>

                    <form className="hero__search" onSubmit={handleSearch} role="search">
                        <input
                            type="text"
                            className="hero__search-input"
                            placeholder={t('home.hero.searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label={t('home.hero.searchAriaLabel')}
                        />
                        <button type="submit" className="hero__search-btn">
                            {t('home.hero.searchButton')}
                        </button>
                    </form>

                    <div className="hero__stats" aria-label="Platform statistics">
                        <div className="hero__stat">
                            <strong>{stats ? formatCompact(stats.totalLearners) : '—'}</strong>
                            <span>{t('home.hero.statActiveLearners')}</span>
                        </div>
                        <div className="hero__stat-divider" aria-hidden="true" />
                        <div className="hero__stat">
                            <strong>{stats ? formatCompact(stats.totalCourses) : '—'}</strong>
                            <span>{t('home.hero.statCourses')}</span>
                        </div>
                        <div className="hero__stat-divider" aria-hidden="true" />
                        <div className="hero__stat">
                            <strong>★ {stats ? stats.avgRating.toFixed(1) : '—'}</strong>
                            <span>{t('home.hero.statAvgRating')}</span>
                        </div>
                    </div>
                </div>

                {/* ── Right column — real featured courses ── */}
                {primaryCourse && (
                    <div className="hero__right" aria-hidden="true">
                        <div className="hero__card">
                            <div className="hero__card-thumb">
                                {thumbnailUrl ? (
                                    <img src={thumbnailUrl} alt={primaryCourse.title} className="hero__card-thumb-img" />
                                ) : (
                                    <div className="hero__card-play">
                                        <div className="hero__play-triangle" />
                                    </div>
                                )}
                                {primaryCourse.categoryName && (
                                    <div className="hero__card-category">{primaryCourse.categoryName.toUpperCase()}</div>
                                )}
                            </div>
                            <div className="hero__card-body">
                                <p className="hero__card-title">{primaryCourse.title}</p>
                                <p className="hero__card-meta">
                                    {t('home.hero.cardBy', { name: primaryCourse.instructorName })}
                                    {formatHours(primaryCourse.totalDurationSeconds) ? ` · ${formatHours(primaryCourse.totalDurationSeconds)}` : ''}
                                    {` · ${t('home.hero.cardStudents', { count: formatCompact(primaryCourse.studentCount) })}`}
                                </p>
                                <div className="hero__card-progress-row">
                                    <span>{primaryCourse.level}</span>
                                    <span className="hero__card-rating">★ {primaryCourse.rating.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>

                        {stats && (
                            <div className="hero__badge-live">
                                <div className="hero__badge-live-num">{formatCompact(stats.totalLearners)}</div>
                                <div className="hero__badge-live-label">{t('home.hero.learnersOnPlatform')}</div>
                            </div>
                        )}

                        {secondaryCourse && (
                            <div className="hero__pill">
                                <div className="hero__pill-thumb" />
                                <div>
                                    <p className="hero__pill-title">{secondaryCourse.title}</p>
                                    <p className="hero__pill-sub">{t('home.hero.pillStudentsEnrolled', { count: formatCompact(secondaryCourse.studentCount) })}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
