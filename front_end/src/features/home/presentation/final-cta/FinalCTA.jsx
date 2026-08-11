import { useState } from 'react';
import './FinalCTA.css';

export default function FinalCTA() {
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Registration redirect — business logic handled elsewhere
        if (email) {
            window.location.href = `/register?email=${encodeURIComponent(email)}`;
        }
    };

    return (
        <section className="fcta" aria-labelledby="fcta-heading">
            <div className="fcta__container">
                <div className="fcta__left">
                    <span className="fcta__eyebrow">Start Today — Free</span>
                    <h2 id="fcta-heading" className="fcta__title">
                        The path is built.<br />
                        Your only job is<br />
                        <em>to start.</em>
                    </h2>

                    <ul className="fcta__risk-list" aria-label="Risk reversals">
                        <li>
                            <span className="fcta__check" aria-hidden="true">✓</span>
                            Free first module in every path
                        </li>
                        <li>
                            <span className="fcta__check" aria-hidden="true">✓</span>
                            No credit card required
                        </li>
                        <li>
                            <span className="fcta__check" aria-hidden="true">✓</span>
                            30-day money-back guarantee
                        </li>
                        <li>
                            <span className="fcta__check" aria-hidden="true">✓</span>
                            Cancel anytime — no questions asked
                        </li>
                    </ul>
                </div>

                <div className="fcta__right">
                    <div className="fcta__card">
                        <p className="fcta__card-label">Get your free learning plan</p>
                        <form className="fcta__form" onSubmit={handleSubmit} noValidate>
                            <input
                                type="email"
                                className="fcta__input"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                aria-label="Email address"
                                autoComplete="email"
                            />
                            <button type="submit" className="fcta__submit">
                                Start Learning Free →
                            </button>
                        </form>
                        <p className="fcta__fine-print">
                            Join 50,000+ learners. No spam, ever.
                        </p>

                        <div className="fcta__social-proof">
                            <div className="fcta__avatars" aria-hidden="true">
                                <div className="fcta__avatar fcta__avatar--1" />
                                <div className="fcta__avatar fcta__avatar--2" />
                                <div className="fcta__avatar fcta__avatar--3" />
                            </div>
                            <p>"I was job-ready in 8 months." — Linh T., Frontend Dev @ Zalo</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
