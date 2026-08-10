import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

const CourseAbout = ({ course }) => {
  const { t } = useTranslation();

  return (
  <section className="learning-content-panel learning-about-panel">
    <h2>{t("profile.learningDetail.courseOverview")}</h2>
    {course.about.map((paragraph) => (
      <p key={paragraph}>{paragraph}</p>
    ))}

    <h3>{t("profile.learningDetail.whatYoullLearn")}</h3>
    <div className="learning-outcome-grid">
      {course.outcomes.map((item) => (
        <div key={item}>
          <Check size={18} />
          <span>{item}</span>
        </div>
      ))}
    </div>
  </section>
  );
};

export default CourseAbout;
