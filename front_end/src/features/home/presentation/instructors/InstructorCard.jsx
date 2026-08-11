import './InstructorCard.css';

export default function InstructorCard({ instructor }) {
    return (
        <article className="ic">
            {/* Company badge above image */}
            <div className="ic__company-bar">
                <span className="ic__company-badge">{instructor.company}</span>
                <span className="ic__years">{instructor.yearsExp} yrs exp</span>
            </div>

            {/* Photo */}
            <div className="ic__photo-wrap">
                <img
                    src={instructor.image}
                    alt={instructor.name}
                    className="ic__photo"
                />
            </div>

            {/* Body */}
            <div className="ic__body">
                <p className="ic__role">{instructor.role}</p>
                <h3 className="ic__name">{instructor.name}</h3>

                {/* Stats */}
                <div className="ic__stats">
                    <div className="ic__stat">
                        <strong>{instructor.rating}</strong>
                        <span>★ Rating</span>
                    </div>
                    <div className="ic__stat-divider" />
                    <div className="ic__stat">
                        <strong>{instructor.students}</strong>
                        <span>Students</span>
                    </div>
                </div>

                {/* Tags */}
                <div className="ic__tags">
                    {instructor.tags.map((tag) => (
                        <span key={tag} className="ic__tag">{tag}</span>
                    ))}
                </div>
            </div>
        </article>
    );
}
