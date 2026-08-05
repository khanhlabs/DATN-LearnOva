import { Award, BookOpen, Star, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import defaultAvatar from "../../../../assets/avatar/DefaultAvatar.jpg";

const statIcons = [Award, BookOpen, Users, Star];

const CourseInstructor = ({ instructor }) => {
    const { t } = useTranslation();

    return (
    <section className="learning-content-panel learning-instructor-panel">
        <div className="learning-instructor-profile">
            <img
                src={instructor?.avatar?.trim() ? instructor.avatar : defaultAvatar}
                alt={instructor?.name || t("profile.learningDetail.instructorFallback")}
            />

            <div>
                <h2>{instructor?.name}</h2>
                <strong>{instructor?.role || t("profile.learningDetail.instructorFallback")}</strong>
                <p>{instructor?.description}</p>
            </div>
        </div>

        {instructor?.stats?.length > 0 && (
            <div className="learning-instructor-stats">
                {instructor.stats.map((stat, index) => {
                    const Icon = statIcons[index % statIcons.length];
                    return (
                        <div key={stat}>
                            <Icon size={18} />
                            <span>{stat}</span>
                        </div>
                    );
                })}
            </div>
        )}
    </section>
    );
};

export default CourseInstructor;
