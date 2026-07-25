import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {getFeaturedCourses, getFileUrl} from '../../../api/PublicCourseApi.js';
import './Course.css';

const formatUsd = (value) => {
  const amount = Number(value) || 0;
  const body = Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2).replace(/\.?0+$/, "");
  return `$${body}`;
};

const FALLBACK_THUMBS = [
    'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
    'linear-gradient(135deg, #4361ee 0%, #7209b7 100%)',
    'linear-gradient(135deg, #f72585 0%, #b5179e 100%)',
    'linear-gradient(135deg, #06d6a0 0%, #118ab2 100%)',
    'linear-gradient(135deg, #8338ec 0%, #3a0ca3 100%)',
    'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    'linear-gradient(135deg, #10b981 0%, #047857 100%)',
];

const formatStudents = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return String(n);
};

const formatHours = (seconds) => {
    if (!seconds) return '0h';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
    return `${m}m`;
};

export default function Course() {
    const { t } = useTranslation();
    const [courses, setCourses] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getFeaturedCourses();
                const withThumbs = await Promise.all(
                    data.map(async (course, idx) => {
                        let thumbnailUrl = null;
                        if (course.thumbnailKey) {
                            try {
                                thumbnailUrl = await getFileUrl(course.thumbnailKey);
                            } catch {
                                // fallback to gradient
                            }
                        }
                        return {...course, thumbnailUrl, fallbackBg: FALLBACK_THUMBS[idx % FALLBACK_THUMBS.length]};
                    })
                );
                setCourses(withThumbs);
            } catch (err) {
                console.error('Failed to load featured courses:', err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const categoryFilters = useMemo(() => {
        const cats = [...new Set(courses.map((c) => c.categoryName).filter(Boolean))];
        return [{label: t('home.course.allCourses'), value: 'ALL'}, ...cats.map((c) => ({label: c, value: c}))];
    }, [courses, t]);

    const visible = filter === 'ALL'
        ? courses
        : courses.filter((c) => c.categoryName === filter);

    if (isLoading) {
        return (
            <section className="cs" aria-labelledby="cs-heading">
                <div className="cs__container">
                    <div className="cs__header">
                        <div>
                            <span className="section-eyebrow">{t('home.course.eyebrow')}</span>
                            <h2 id="cs-heading" className="cs__title">{t('home.course.title')}</h2>
                        </div>
                    </div>
                    <div style={{textAlign: 'center', padding: '60px 0', color: '#94a3b8', fontSize: '15px'}}>
                        {t('home.course.loading')}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="cs" aria-labelledby="cs-heading">
            <div className="cs__container">
                <div className="cs__header">
                    <div>
                        <span className="section-eyebrow">{t('home.course.eyebrow')}</span>
                        <h2 id="cs-heading" className="cs__title">{t('home.course.title')}</h2>
                    </div>
                    <a href="/courses" className="cs__link">{t('home.course.browseAll')}</a>
                </div>

                {categoryFilters.length > 1 && (
                    <div className="cs__filters" role="group" aria-label="Filter by category">
                        {categoryFilters.map((f) => (
                            <button
                                key={f.value}
                                className={`cs__filter-btn ${filter === f.value ? 'cs__filter-btn--active' : ''}`}
                                onClick={() => setFilter(f.value)}
                                aria-pressed={filter === f.value}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="cs__grid">
                    {visible.map((course) => (
                        <Link
                            key={course.courseId}
                            to={`/learnova/courses/detail/${course.courseId}`}
                            className="cs__card"
                        >
                            <div
                                className="cs__thumb"
                                style={
                                    course.thumbnailUrl
                                        ? {background: `url(${course.thumbnailUrl}) center/cover no-repeat`}
                                        : {background: course.fallbackBg}
                                }
                            >
                                {!course.thumbnailUrl && (
                                    <div className="cs__play">
                                        <div className="cs__play-tri"/>
                                    </div>
                                )}
                                {course.studentCount > 0 && (
                                    <span className="cs__badge">{t('home.course.bestseller')}</span>
                                )}
                            </div>
                            <div className="cs__body">
                                <h3 className="cs__course-title">{course.title}</h3>
                                <p className="cs__instructor">{course.instructorName}</p>
                                <div className="cs__rating-row">
                                    <div>
                                        <span className="cs__rating">★ </span>
                                        <span className="cs__rating-value">{course.rating.toFixed(1)}</span>
                                    </div>
                                    <span className="cs__reviews">(0)</span>
                                    <span className="cs__meta">
                                            {formatHours(course.totalDurationSeconds)} · {course.level}
                                    </span>
                                </div>
                                <div className="cs__footer">
                                    <div className="cs__price-row">
                                        {course.discountPercent ? (
                                            <>
                                                <span className="cs__price cs__price--sale">
                                                    {formatUsd(course.basePrice * (1 - course.discountPercent / 100))}
                                                </span>
                                                <span className="cs__original">{formatUsd(course.basePrice)}</span>
                                                <span className="cs__discount-badge">-{course.discountPercent}%</span>
                                            </>
                                        ) : (
                                            <span className="cs__price">{formatUsd(course.basePrice)}</span>
                                        )}
                                    </div>
                                    <span className="cs__students">{t('home.course.studentsLabel', { count: formatStudents(course.studentCount) })}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
