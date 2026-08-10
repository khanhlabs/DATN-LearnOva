import Header from '../../../shared/components/header/user_header/Header';
import HeroSplit from './hero/HeroSplit';
import TrustBar from './hero/TrustBar';
import ContinueLearning from '../../../shared/components/courses/ContinueLearning';
import Course from './courses/Course';
import Categories from './categories/Categories';
import HowItWorks from './how_it_work/HowItWorks';
import Instructors from './instructors/Instructors';
import Testimonials from './testimonials/Testimonials';
import FAQ from './faq/FAQ';
import Footer from '../../../shared/components/footer/Footer';
import LearnovaAI from './chat_bot/chatBot';

import './Home';

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
