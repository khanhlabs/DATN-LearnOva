import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Testimonials.css';
import { getPlatformTestimonialsApi } from '../../../api/ReviewApi.js';

const CARD_COLORS = ['#4361ee', '#f72585', '#06d6a0', '#f59e0b', '#7209b7', '#2563eb'];

export default function Testimonials() {
    const { t } = useTranslation();
    const [testimonials, setTestimonials] = useState([]);

    useEffect(() => {
        let mounted = true;

        getPlatformTestimonialsApi()
            .then((data) => mounted && setTestimonials(Array.isArray(data) ? data : []))
            .catch(() => {});

        return () => {
            mounted = false;
        };
    }, []);

    if (testimonials.length === 0) {
        return null;
    }

    return (
        <section className="testi" aria-labelledby="testi-heading">
            <div className="testi__container">
                <div className="testi__header">
                    <span className="section-eyebrow">{t('home.testimonials.eyebrow')}</span>
                    <h2 id="testi-heading" className="testi__title">
                        {t('home.testimonials.titleLine1')}<br />{t('home.testimonials.titleLine2')}
                    </h2>
                </div>

                <div className="testi__grid">
                    {testimonials.map((item, i) => {
                        const color = CARD_COLORS[i % CARD_COLORS.length];
                        const initial = (item.reviewerName || '?').trim().charAt(0).toUpperCase();

                        return (
                            <article
                                key={item.reviewId}
                                className="testi__card"
                                style={{ '--corner': color + '0d' }}
                            >
                                <div className="testi__corner" aria-hidden="true" />
                                <div className="testi__quote-mark" style={{ color }} aria-hidden="true">"</div>
                                <div className="testi__stars" aria-label={`${item.rating} stars`}>
                                    {'★'.repeat(item.rating)}{'☆'.repeat(Math.max(0, 5 - item.rating))}
                                </div>
                                <blockquote className="testi__text">{item.comment}</blockquote>
                                <div className="testi__author">
                                    {item.reviewerAvatar ? (
                                        <img
                                            src={item.reviewerAvatar}
                                            alt={item.reviewerName}
                                            className="testi__avatar testi__avatar--img"
                                        />
                                    ) : (
                                        <div
                                            className="testi__avatar"
                                            style={{
                                                background: `linear-gradient(135deg, ${color}, ${color}88)`
                                            }}
                                            aria-hidden="true"
                                        >
                                            {initial}
                                        </div>
                                    )}
                                    <div>
                                        <p className="testi__name">{item.reviewerName}</p>
                                        <p className="testi__role">{t('home.testimonials.studentOf', { courseTitle: item.courseTitle })}</p>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
