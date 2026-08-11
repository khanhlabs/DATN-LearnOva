import { CheckCircle, Circle, Play } from 'lucide-react';
import './ProductMockup.css';

const lessons = [
    { id: 1, title: 'Introduction to Web',    done: true  },
    { id: 2, title: 'HTML & CSS Basics',       done: true  },
    { id: 3, title: 'CSS Grid & Flexbox',      done: true  },
    { id: 4, title: 'JavaScript Essentials',   active: true },
    { id: 5, title: 'DOM Manipulation',        done: false },
    { id: 6, title: 'React Fundamentals',      done: false },
];

export default function ProductMockup() {
    return (
        <div className="pm">
            {/* Browser chrome */}
            <div className="pm__chrome">
                <div className="pm__dots">
                    <span className="pm__dot pm__dot--red" />
                    <span className="pm__dot pm__dot--yellow" />
                    <span className="pm__dot pm__dot--green" />
                </div>
                <div className="pm__url">learnova.io/course/fullstack</div>
            </div>

            {/* App body: sidebar + player */}
            <div className="pm__body">
                {/* Sidebar — lesson list */}
                <div className="pm__sidebar">
                    <div className="pm__sidebar-header">
                        <p className="pm__course-name">Fullstack Developer</p>
                        <div className="pm__progress">
                            <div className="pm__progress-track">
                                <div className="pm__progress-fill" />
                            </div>
                            <span className="pm__progress-label">12 / 24 lessons</span>
                        </div>
                    </div>

                    <ul className="pm__lesson-list" aria-label="Course lessons">
                        {lessons.map((l) => (
                            <li
                                key={l.id}
                                className={[
                                    'pm__lesson',
                                    l.done   ? 'pm__lesson--done'   : '',
                                    l.active ? 'pm__lesson--active' : '',
                                ].join(' ')}
                            >
                                {l.done ? (
                                    <CheckCircle size={12} className="pm__lesson-icon pm__lesson-icon--check" aria-hidden="true" />
                                ) : l.active ? (
                                    <Play size={10} fill="currentColor" className="pm__lesson-icon pm__lesson-icon--play" aria-hidden="true" />
                                ) : (
                                    <Circle size={12} className="pm__lesson-icon pm__lesson-icon--empty" aria-hidden="true" />
                                )}
                                <span className="pm__lesson-title">{l.title}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Player area */}
                <div className="pm__player">
                    <div className="pm__video">
                        <div className="pm__play-btn" aria-hidden="true">
                            <Play size={20} fill="#ffffff" color="#ffffff" />
                        </div>
                        <div className="pm__video-meta">
                            <span className="pm__video-label">Now Playing</span>
                            <p className="pm__video-title">JavaScript Essentials</p>
                        </div>
                    </div>

                    <div className="pm__player-footer">
                        <span className="pm__player-continue">▶ Continue watching</span>
                        <span className="pm__player-time">24:15 remaining</span>
                    </div>
                </div>
            </div>

            {/* Floating certificate badge */}
            <div className="pm__cert" aria-hidden="true">
                <div className="pm__cert-icon">🏆</div>
                <div className="pm__cert-body">
                    <p className="pm__cert-label">Certificate Ready</p>
                    <p className="pm__cert-title">Fullstack Developer</p>
                </div>
            </div>
        </div>
    );
}
