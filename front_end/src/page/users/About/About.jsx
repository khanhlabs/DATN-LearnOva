import React from 'react';
import './About.css';
import { Award, Target, Globe, Users, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LearnovaAI from '../../home/chat-bot/chatBot.jsx';

function AboutView() {
    const { t } = useTranslation();

    return (
        <div className="about-main-container">
            {/* NHÚNG GOOGLE FONT TRỰC TIẾP ĐỂ TRÁNH LỖI PHÔNG CHỮ TIẾNG VIỆT */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

            {/* Intro Context */}
            <section className="about-section-padding">
                <div style={{ position: 'absolute', top: '-10rem', left: '-10rem', width: '24rem', height: '24rem', backgroundColor: 'rgba(255,125,0,0.05)', borderRadius: '50%', filter: 'blur(64px)', pointerEvents: 'none' }}></div>

                <div className="about-grid-layout">
                    <div className="about-content-side">
                        <h2 className="about-font-serif-premium about-section-title">
                            {t('about.titleLine1')} <br /> <span className="about-text-orange">{t('about.titleKnowledge')}</span> {t('about.titleAnd')} <span className="about-text-italic-gold">{t('about.titleAspiration')}</span>
                        </h2>

                        <div className="about-text-body-light about-content-space">
                            <p>
                                {t('about.paragraph1')}
                            </p>
                            <p>
                                {t('about.paragraph2')}
                            </p>
                            <p>
                                {t('about.paragraph3')}
                            </p>
                        </div>
                    </div>
                    <div className="about-image-wrapper">
                        <div className="about-blur-bg-effect"></div>
                        <img
                            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200"
                            alt="Community"
                            className="about-premium-img"
                        />
                        <div className="about-floating-badge">
                            <div className="about-font-serif-premium about-badge-num">50k+</div>
                            <div className="about-badge-text">{t('about.trustedByLearners')}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="about-section-padding about-values-section">
                <div style={{ position: 'absolute', bottom: '-10rem', right: '-10rem', width: '24rem', height: '24rem', backgroundColor: 'rgba(255,161,7,0.05)', borderRadius: '50%', filter: 'blur(64px)', pointerEvents: 'none' }}></div>

                <div className="about-section-header-center">
                    <span className="about-section-subtitle-tag">{t('about.coreValuesTag')}</span>
                    <h2 className="about-font-serif-premium about-section-title" style={{ margin: 0 }}>
                        {t('about.coreValuesTitle')}
                    </h2>
                </div>

                <div className="about-values-grid">
                    {[
                        {
                            icon: <Award style={{ color: 'var(--about-orange)', transition: 'colors 0.5s' }} size={32} />,
                            title: t('about.value1Title'),
                            desc: t('about.value1Desc')
                        },
                        {
                            icon: <Target style={{ color: 'var(--about-orange)', transition: 'colors 0.5s' }} size={32} />,
                            title: t('about.value2Title'),
                            desc: t('about.value2Desc')
                        },
                        {
                            icon: <Users style={{ color: 'var(--about-orange)', transition: 'colors 0.5s' }} size={32} />,
                            title: t('about.value3Title'),
                            desc: t('about.value3Desc')
                        }
                    ].map((val, i) => (
                        <div key={i} className="about-value-card">
                            <div className="about-icon-box">
                                {val.icon}
                            </div>
                            <h3 className="about-font-serif-premium about-value-card-title">{val.title}</h3>
                            <p className="about-text-body-light" style={{ margin: 0 }}>{val.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Mission Section */}
            <section className="about-section-padding about-mission-section">
                <div className="about-mission-globe-bg">
                    <Globe size={800} />
                </div>

                <div className="about-grid-layout">
                    <div className="about-mission-content-side">
                        <h2
                            className="about-font-serif-premium about-section-title"
                            style={{ color: '#ffa107' }}
                        >
                            {t('about.missionTitleLine1')} <span className="about-text-italic-gold">{t('about.missionTitleHighlight')}</span>
                        </h2>

                        <div
                            className="about-text-body-light about-content-space"
                            style={{ color: '#ffa107' }}
                        >
                            <p>
                                {t('about.missionParagraph1')}
                            </p>

                            <p>
                                {t('about.missionParagraph2')}
                            </p>

                            <div className="about-stats-row">
                                <div>
                                    <div
                                        className="about-font-serif-premium about-badge-num"
                                        style={{
                                            fontSize: '2.5rem',
                                            fontWeight: '600',
                                            color: '#ffa107'
                                        }}
                                    >
                                        100+
                                    </div>
                                    <div
                                        className="about-badge-text"
                                        style={{ color: '#ffa107' }}
                                    >
                                        {t('about.statCourses')}
                                    </div>
                                </div>

                                <div>
                                    <div
                                        className="about-font-serif-premium about-badge-num"
                                        style={{
                                            fontSize: '2.5rem',
                                            fontWeight: '600',
                                            color: '#ffa107'
                                        }}
                                    >
                                        200+
                                    </div>
                                    <div
                                        className="about-badge-text"
                                        style={{ color: '#ffa107' }}
                                    >
                                        {t('about.statInstructors')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="about-image-wrapper">
                        <div className="about-premium-img-wrapper">
                            <img
                                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=1200"
                                alt="Mission"
                                className="about-mission-img-raw"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="about-section-padding">
                <div className="about-cta-box">
                    <div style={{ position: 'absolute', top: '-6rem', left: '-6rem', width: '24rem', height: '24rem', backgroundColor: 'rgba(255,125,0,0.05)', borderRadius: '50%', filter: 'blur(64px)', pointerEvents: 'none' }}></div>
                    <div style={{ position: 'absolute', bottom: '-6rem', right: '-6rem', width: '24rem', height: '24rem', backgroundColor: 'rgba(250,228,170,0.1)', borderRadius: '50%', filter: 'blur(64px)', pointerEvents: 'none' }}></div>

                    <div style={{ position: 'relative', zIndex: 10 }}>
                        <h2 className="about-font-serif-premium about-section-title">
                            {t('about.ctaTitleLine1')} <br /> <span style={{ color: '#ffaa16' }}>{t('about.ctaTitleHighlight')}</span> {t('about.ctaTitleEnd')}
                        </h2>

                        <p className="about-text-body-light about-cta-desc">
                            {t('about.ctaDescription')}
                        </p>

                        <div className="about-btn-container">
                            <button className="about-btn-primary">
                                {t('about.ctaExplore')}
                                <ChevronRight size={16} />
                            </button>

                            <button className="about-btn-secondary">
                                {t('about.ctaContact')}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="chatbot-fixed">
                    <LearnovaAI />
                </div>
            </section>
        </div>
    );
} export default AboutView
