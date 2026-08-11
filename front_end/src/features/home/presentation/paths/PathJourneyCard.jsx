import { ArrowRight } from 'lucide-react';
import './PathJourneyCard.css';

const phaseConfig = {
    Start:    { color: '#22c55e', tag: 'START'   },
    Skills:   { color: '#2563eb', tag: 'SKILLS'  },
    Projects: { color: '#f59e0b', tag: 'BUILD'   },
    Outcome:  { color: '#a855f7', tag: 'OUTCOME' },
};

export default function PathJourneyCard({ path }) {
    const Icon = path.icon;

    return (
        <article className="pjc">
            {/* Header */}
            <div className="pjc__head">
                <div className="pjc__icon-wrap">
                    <Icon size={26} />
                </div>
                <div className="pjc__meta">
                    <h3 className="pjc__title">{path.title}</h3>
                    <p className="pjc__duration">
                        {path.duration} &nbsp;·&nbsp; {path.courseCount} courses
                    </p>
                </div>
            </div>

            {/* Journey timeline */}
            <div className="pjc__timeline">
                {path.journey.map((step, i) => {
                    const cfg = phaseConfig[step.phase] ?? { color: '#64748b', tag: step.phase.toUpperCase() };
                    return (
                        <div key={i} className="pjc__step">
                            {i > 0 && (
                                <div className="pjc__connector" aria-hidden="true">
                                    <div className="pjc__connector-line" />
                                </div>
                            )}
                            <div className="pjc__step-row">
                                <div
                                    className="pjc__dot"
                                    style={{ background: cfg.color }}
                                    aria-hidden="true"
                                />
                                <div className="pjc__step-body">
                                    <span
                                        className="pjc__phase-tag"
                                        style={{ color: cfg.color }}
                                    >
                                        {cfg.tag}
                                    </span>
                                    <p className="pjc__step-label">{step.label}</p>
                                    <p className="pjc__step-desc">{step.desc}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Outcome bar */}
            <div className="pjc__outcome">
                <div className="pjc__outcome-col">
                    <span className="pjc__outcome-label">Career outcome</span>
                    <p className="pjc__outcome-value">{path.outcome}</p>
                </div>
                <div className="pjc__outcome-divider" />
                <div className="pjc__outcome-col">
                    <span className="pjc__outcome-label">Salary</span>
                    <p className="pjc__outcome-salary">{path.salary}</p>
                </div>
            </div>

            <button className="pjc__cta">
                Explore This Path
                <ArrowRight size={15} />
            </button>
        </article>
    );
}
