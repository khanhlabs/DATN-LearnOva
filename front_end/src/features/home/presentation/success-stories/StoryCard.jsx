import './StoryCard.css';

export default function StoryCard({ story }) {
    return (
        <article className="sc">
            {/* Identity row */}
            <div className="sc__identity">
                <img
                    src={story.photo}
                    alt={story.name}
                    className="sc__photo"
                />
                <div className="sc__identity-text">
                    <p className="sc__name">{story.name}</p>
                    <p className="sc__path">{story.path}</p>
                </div>
            </div>

            {/* Before → After */}
            <div className="sc__transform">
                <div className="sc__transform-col">
                    <span className="sc__label sc__label--before">Before</span>
                    <p className="sc__role sc__role--before">{story.before}</p>
                </div>

                <div className="sc__arrow" aria-hidden="true">→</div>

                <div className="sc__transform-col">
                    <span className="sc__label sc__label--after">After</span>
                    <p className="sc__role sc__role--after">{story.after}</p>
                    <span className="sc__company-badge">{story.company}</span>
                </div>
            </div>

            {/* Time taken */}
            <div className="sc__time">
                <div className="sc__time-track">
                    <div className="sc__time-fill" />
                </div>
                <span className="sc__time-label">
                    {story.timeMonths} months to job-ready
                </span>
            </div>

            {/* Quote */}
            <blockquote className="sc__quote">
                "{story.quote}"
            </blockquote>
        </article>
    );
}
