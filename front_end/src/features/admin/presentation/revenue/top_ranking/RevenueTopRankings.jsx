import { Link } from "react-router-dom";
import TopCourseRevenue from "../top_course_revenue/TopCourseRevenue";
import TopTeacherRevenue from "../top_teacher_revenue/TopTeacherRevenue";
import "../Revenue";
import { useTranslation } from "react-i18next";

const RevenueTopRankings = () => {
  const { t } = useTranslation();
  return (
    <div className="revenuePage">
      <div className="revenuePageInner">
        <div className="revenueDetailHeader">
          <div>
            <h2>{t("revenueDetails.ranking")}</h2><p>{t("revenueDetails.rankingDesc")}</p>
          </div>
          <Link className="revenueDetailBack" to="/learnova/admin/revenue">
            {t("revenueDetails.back")}
          </Link>
        </div>

        <div className="revenueDetailStack">
          <TopCourseRevenue />
          <TopTeacherRevenue />
        </div>
      </div>
    </div>
  );
};

export default RevenueTopRankings;
