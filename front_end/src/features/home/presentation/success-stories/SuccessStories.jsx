import StoryCard from './StoryCard';
import './SuccessStories';

import instructor1 from '../../../assets/instructors/instructor-1.jpg';
import instructor2 from '../../../assets/instructors/instructor-2.jpg';
import instructor3 from '../../../assets/instructors/instructor-3.jpg';

const stories = [
    {
        photo: instructor1,
        name: 'Nguyen Thi Linh',
        before: 'Retail Store Worker',
        after: 'Frontend Developer',
        company: 'Zalo',
        timeMonths: 7,
        path: 'Fullstack Developer Path',
        quote: 'The path stopped me from guessing and got me building. I had a job offer before I even finished the last module.',
    },
    {
        photo: instructor2,
        name: 'Tran Minh Duc',
        before: 'Accountant',
        after: 'Data Analyst',
        company: 'Vingroup',
        timeMonths: 9,
        path: 'Data Scientist Path',
        quote: 'I had zero technical background. The real projects in the path are what actually got me the interview.',
    },
    {
        photo: instructor3,
        name: 'Le Phuong Anh',
        before: 'Recent Graduate',
        after: 'UX Designer',
        company: 'MoMo',
        timeMonths: 5,
        path: 'Product Design Path',
        quote: 'Graduated with no portfolio. LearnOva gave me three real projects to show. That changed everything.',
    },
];

export default function SuccessStories() {
    return (
        <section className="ss" aria-labelledby="ss-heading">
            <div className="ss__container">
                <div className="ss__header">
                    <span className="section-eyebrow">Real Outcomes</span>
                    <h2 id="ss-heading" className="ss__title">
                        People who chose the path.
                    </h2>
                    <p className="ss__subtitle">
                        Not generic praise. Real people, real careers, real timelines.
                    </p>
                </div>

                <div className="ss__grid">
                    {stories.map((story, i) => (
                        <StoryCard key={i} story={story} />
                    ))}
                </div>
            </div>
        </section>
    );
}
