import { useEffect, useState } from "react";
import { getAdminTopEarningInstructorsApi } from "../../../infrastructure/api/RevenueApi";
import "./TopTeacherRevenue.css";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 5;

const formatMoney = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;

const formatPercent = (value) => `${Number(value || 0).toFixed(0)}%`;

const TopTeacherRevenue = () => {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadTeachers = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getAdminTopEarningInstructorsApi({
          page,
          size: PAGE_SIZE,
        });

        if (!isMounted) return;

        setTeachers(Array.isArray(data?.content) ? data.content : []);
        setTotalPages(Number(data?.totalPages || 0));
      } catch {
        if (!isMounted) return;
        setTeachers([]);
        setTotalPages(0);
        setError("Unable to load top earning instructors.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTeachers();

    return () => {
      isMounted = false;
    };
  }, [page]);

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index);

  return (
    <section
      className="topRevenueBlockSection topTeacherRevenueCard"
      aria-label="Top earning instructor partners"
    >
      <div className="topRevenueBlockHeader">
        <div>
          <h2 className="topRevenueBlockTitle">
            {t("revenueDetails.topTeachers")}
          </h2>
          <p className="topRevenueBlockSubtitle">
            {t("revenueDetails.topTeachersDesc")}
          </p>
        </div>
        <span className="topRevenueBlockBadge">{t("revenueDetails.summary")}</span>
      </div>

      <div className="topRevenueBlockCard">
        <div className="topRevenueBlockTableWrapper">
          <table className="topRevenueBlockTable topTeacherTable">
            <thead>
              <tr>
                <th>{t("revenueDetails.rank")}</th><th>{t("revenueDetails.instructor")}</th><th>{t("revenueDetails.courses")}</th><th>{t("revenueDetails.totalStudents")}</th><th>{t("revenueDetails.earned")}</th><th>{t("revenueDetails.avgCourse")}</th><th>{t("revenueDetails.share")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="topRevenueBlockState">
                    Loading...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="topRevenueBlockState">
                    {error}
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="topRevenueBlockState">
                    No paid instructor revenue data yet.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher, index) => (
                  <tr key={teacher.instructorId}>
                    <td>
                      <span className="topRevenueBlockRank">
                        {page * PAGE_SIZE + index + 1}
                      </span>
                    </td>
                    <td>
                      <div className="topTeacherCell">
                        <span className="topTeacherName">
                          {teacher.instructor || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td>
                      {Number(teacher.totalCourses || 0).toLocaleString("en-US")}
                    </td>
                    <td>
                      {Number(teacher.totalStudents || 0).toLocaleString("en-US")}
                    </td>
                    <td className="topTeacherRevenue">
                      {formatMoney(teacher.revenue)}
                    </td>
                    <td>{formatMoney(teacher.avgPerCourse)}</td>
                    <td>{formatPercent(teacher.share)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 0 && (
          <div
            className="topRevenuePagination"
            aria-label="Top instructor revenue pages"
          >
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={pageNumber === page ? "active" : ""}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TopTeacherRevenue;
