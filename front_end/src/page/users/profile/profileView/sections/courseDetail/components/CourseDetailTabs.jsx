import { BookOpen, Info, Star, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { COURSE_DETAIL_TABS } from "../data/courseDetailData";

const tabIcons = {
  curriculum: BookOpen,
  about: Info,
  instructor: Users,
  reviews: Star,
};

const CourseDetailTabs = ({ activeTab, onChangeTab, reviews }) => {
  const { t } = useTranslation();

  return (
  <div className="learning-detail-tabs">
    {COURSE_DETAIL_TABS.map((tab) => {
      const Icon = tabIcons[tab.id];
      const tabLabel = t(tab.labelKey);
      const label = tab.id === "reviews" ? `${tabLabel} (${reviews})` : tabLabel;

      return (
        <button
          key={tab.id}
          className={activeTab === tab.id ? "active" : ""}
          type="button"
          onClick={() => onChangeTab(tab.id)}
        >
          <Icon size={18} />
          {label}
        </button>
      );
    })}
  </div>
  );
};

export default CourseDetailTabs;
