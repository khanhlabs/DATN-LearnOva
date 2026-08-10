import { Code, LineChart } from 'lucide-react';
import PathJourneyCard from './PathJourneyCard';
import './LearningPaths';

const paths = [
    {
        id: 1,
        title: 'Fullstack Developer',
        icon: Code,
        duration: '6–8 months',
        courseCount: 24,
        outcome: 'Junior Developer',
        salary: 'Avg. 15M VNĐ/month',
        journey: [
            {
                phase: 'Start',
                label: 'HTML/CSS & Web Basics',
                desc: 'Master structure, layout, and modern design thinking.',
            },
            {
                phase: 'Skills',
                label: 'JavaScript, React & Node.js',
                desc: 'Build dynamic UIs and backend APIs from scratch.',
            },
            {
                phase: 'Projects',
                label: '3 Real-World Applications',
                desc: 'Deploy portfolio-ready projects employers can actually see.',
            },
            {
                phase: 'Outcome',
                label: 'Junior Developer',
                desc: 'Enter the job market with skills, portfolio, and certificate.',
            },
        ],
    },
    {
        id: 2,
        title: 'Data Scientist',
        icon: LineChart,
        duration: '8–10 months',
        courseCount: 30,
        outcome: 'Data Analyst',
        salary: 'Avg. 18M VNĐ/month',
        journey: [
            {
                phase: 'Start',
                label: 'Math Fundamentals & Python',
                desc: 'Foundation in statistics and programming for data work.',
            },
            {
                phase: 'Skills',
                label: 'SQL, Data Mining & ML',
                desc: 'Query large datasets and build predictive models.',
            },
            {
                phase: 'Projects',
                label: '2 ML Models on Real Datasets',
                desc: 'Real data. Real predictions. Real portfolio pieces.',
            },
            {
                phase: 'Outcome',
                label: 'Data Analyst / Scientist',
                desc: 'Join data teams at Vietnam\'s top technology companies.',
            },
        ],
    },
];

export default function LearningPaths() {
    return (
        <section className="lp" aria-labelledby="lp-heading">
            <div className="lp__container">
                <div className="lp__header">
                    <span className="lp__eyebrow">Structured Paths</span>
                    <h2 id="lp-heading" className="lp__title">
                        Know exactly where you're going<br />
                        before you take the first step.
                    </h2>
                    <p className="lp__subtitle">
                        Every path is a complete career system — not a course list.
                    </p>
                </div>

                <div className="lp__grid">
                    {paths.map((path) => (
                        <PathJourneyCard key={path.id} path={path} />
                    ))}
                </div>

                <div className="lp__footer">
                    <p className="lp__footer-text">Not sure which path is right for you?</p>
                    <button className="lp__quiz-btn">
                        Take the 2-Minute Career Quiz →
                    </button>
                </div>
            </div>
        </section>
    );
}
