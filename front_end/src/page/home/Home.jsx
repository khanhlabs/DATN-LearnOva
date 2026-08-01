import Header from '../../component/header/user_header/Header.jsx';
import HeroSplit from './hero/HeroSplit.jsx';
import TrustBar from './hero/TrustBar.jsx';
import ContinueLearning from './dashboard/components/ContinueLearning.jsx';
import Course from './courses/Course.jsx';
import Categories from './categories/Categories.jsx';
import HowItWorks from './how-it-works/HowItWorks.jsx';
import Instructors from './instructors/Instructors.jsx';
import Testimonials from './testimonials/Testimonials.jsx';
import FAQ from './faq/FAQ.jsx';
import Footer from './../../component/footer/footer.jsx';
import LearnovaAI from './chat-bot/chatBot.jsx';

import './Home.css';

const Home = () => {
    return (
        <>
            <a href="#main-content" className="home-skip-link">Skip to main content</a>

            <Header />
            <HeroSplit />
            <ContinueLearning />
            <TrustBar />

            <main id="main-content">
                <Course />
                <HowItWorks />
                <Categories />
                <Instructors />
                <Testimonials />
                <FAQ />
                <Footer />

                <div
                    className="chatbot-fixed"
                    role="complementary"
                    aria-label="AI Chat Assistant"
                >
                    <LearnovaAI />
                </div>
            </main>
        </>
    );
};

export default Home;
