import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getTopCategories } from '../../../api/PublicCourseApi.js';
import './Categories.css';

const PALETTE = [
    '#2563eb', '#4361ee', '#f72585', '#06d6a0',
    '#8338ec', '#f59e0b', '#118ab2', '#0ea5e9',
];

const colorForCategory = (id, index) => PALETTE[(id ?? index) % PALETTE.length];

export default function Categories() {
    const { t, i18n } = useTranslation();
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        getTopCategories()
            .then(setCategories)
            .catch(() => setCategories([]));
    }, []);

    if (categories.length === 0) {
        return null;
    }

    const formatSoldCount = (soldCount) =>
        soldCount > 0
            ? t('home.categories.soldCount', { count: soldCount.toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US') })
            : t('home.categories.updating');

    return (
        <section className="cats" aria-labelledby="cats-heading">
            <div className="cats__container">
                <div className="cats__header">
                    <span className="section-eyebrow">{t('home.categories.eyebrow')}</span>
                    <h2 id="cats-heading" className="cats__title">
                        {t('home.categories.titleLine1')}<br />{t('home.categories.titleLine2')}
                    </h2>
                </div>

                <div className="cats__grid">
                    {categories.map((cat, index) => (
                        <a key={cat.id} href="/learnova/courses" className="cats__card">
                            <div
                                className="cats__icon"
                                style={{ background: colorForCategory(cat.id, index) + '18', color: colorForCategory(cat.id, index) }}
                            >
                                {cat.name.charAt(0).toUpperCase()}
                            </div>
                            <p className="cats__name">{cat.name}</p>
                            <p className="cats__count">{formatSoldCount(cat.soldCount)}</p>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
