import { Compass, Code2, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './HowItWorks.css';

const STEP_ICONS = [Compass, Code2, Briefcase];

export default function HowItWorks() {
    const { t } = useTranslation();
    const steps = t('home.howItWorks.steps', { returnObjects: true });

    return (
        <section className="hiw" aria-labelledby="hiw-heading">
            <div className="hiw__container">
                <div className="hiw__header">
                    <span className="section-eyebrow">{t('home.howItWorks.eyebrow')}</span>
                    <h2 id="hiw-heading" className="hiw__title">
                        {t('home.howItWorks.titleLine1')}<br />
                        {t('home.howItWorks.titleLine2')}
                    </h2>
                </div>

                <div className="hiw__steps">
                    {steps.map((step, i) => {
                        const Icon = STEP_ICONS[i % STEP_ICONS.length];
                        return (
                            <div key={step.number} className="hiw__step-wrap">
                                <div className="hiw__step">
                                    <div className="hiw__number">{step.number}</div>
                                    <div className="hiw__icon-wrap">
                                        <Icon size={26} />
                                    </div>
                                    <h3 className="hiw__step-title">{step.title}</h3>
                                    <p className="hiw__step-desc">{step.desc}</p>
                                </div>

                                {i < steps.length - 1 && (
                                    <div className="hiw__arrow" aria-hidden="true">›</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
