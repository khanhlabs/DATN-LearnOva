import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './FAQ.css';

export default function FAQ() {
    const { t } = useTranslation();
    const [open, setOpen] = useState(null);
    const questions = t('home.faq.questions', { returnObjects: true });

    return (
        <section className="faq" aria-labelledby="faq-heading">
            <div className="faq__container">
                <div className="faq__header">
                    <span className="section-eyebrow">{t('home.faq.eyebrow')}</span>
                    <h2 id="faq-heading" className="faq__title">
                        {t('home.faq.titleLine1')}<br />{t('home.faq.titleLine2')}
                    </h2>
                </div>

                <div className="faq__list">
                    {questions.map((item, i) => (
                        <div
                            key={i}
                            className={`faq__item ${open === i ? 'faq__item--open' : ''}`}
                        >
                            <button
                                className="faq__question"
                                onClick={() => setOpen(open === i ? null : i)}
                                aria-expanded={open === i}
                                aria-controls={`faq-answer-${i}`}
                            >
                                <span>{item.q}</span>
                                <ChevronDown size={18} className="faq__icon" />
                            </button>
                            <div
                                id={`faq-answer-${i}`}
                                className="faq__answer"
                                role="region"
                            >
                                <p>{item.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
