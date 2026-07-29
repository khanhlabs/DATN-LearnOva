import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import CourseCardGrid from "./CourseCardGrid";

const ITEMS_PER_PAGE = 8;

const CoursesSection = ({
  purchasedCourses = [],
  isLoading = false,
  error = "",
  onBack,
  onOpenCourse,
}) => {
  // The URL's ?tab= param is the source of truth for which tab is active, so a
  // notification link (or any navigation) to this same route always lands on the
  // right tab, even when the component doesn't remount.
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const [filterTab, setFilterTab] = useState("in_progress");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const statusFilter = searchParams.get("tab") === "completed" ? "completed" : "inProgress";

  const selectTab = (tab) => {
    setSearchParams(tab === "completed" ? { tab: "completed" } : {});
    setCurrentPage(1);
  };

  const courses = purchasedCourses.map((course) => ({
    ...course,
    progress: course.progress || 0,
    lessonsDone: course.lessonsDone || 0,
    lessonsTotal: course.lessonsTotal || 0,
    remaining: course.remaining || "Not started yet",
    rating: course.rating || 4.8,
    reviews: course.reviews || "0",
  }));
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (filterTab === "in_progress") {
        return course.progress < 100;
      }
      if (filterTab === "completed") {
        return course.progress >= 100;
      }
      return true;
    });
  }, [courses, filterTab]);

  const sortedCourses = useMemo(() => {
    const nextCourses = [...filteredCourses];

    if (sortBy === "oldest") {
      return nextCourses.reverse();
    }

    if (sortBy === "az") {
      return nextCourses.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sortBy === "progress") {
      return nextCourses.sort((a, b) => b.progress - a.progress);
    }

    return nextCourses;
  }, [filteredCourses, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedCourses.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCourses = sortedCourses.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (safePage <= 3) {
      return [1, 2, 3, "...", totalPages];
    }

    if (safePage >= totalPages - 2) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", safePage, "...", totalPages];
  }, [safePage, totalPages]);

  return (
    <div className="courses-dashboard">
      <div className="courses-topbar">
        <div>
          <h2>{t("profile.myLearning.title")}</h2>
          <div className="course-tabs">
            <button
              className={`course-tab ${filterTab === "in_progress" ? "active" : ""}`}
              type="button"
              onClick={() => { setFilterTab("in_progress"); setCurrentPage(1); }}
            >
              {t("profile.myLearning.tabInProgress")}
            </button>
            <button
              className={`course-tab ${filterTab === "completed" ? "active" : ""}`}
              type="button"
              onClick={() => { setFilterTab("completed"); setCurrentPage(1); }}
            >
              {t("profile.myLearning.tabCompleted")}
            </button>
          </div>
        </div>

        <div className="course-tools">
          <label className="course-search">
            <input type="text" placeholder={t("profile.myLearning.searchPlaceholder")} />
            <Search size={15} />
          </label>
          <select
            className="course-sort"
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value);
              setCurrentPage(1);
            }}
            aria-label={t("profile.myLearning.sortAria")}
          >
            <option value="newest">{t("profile.myLearning.sortNewest")}</option>
            <option value="oldest">{t("profile.myLearning.sortOldest")}</option>
            <option value="az">{t("profile.myLearning.sortAz")}</option>
            <option value="progress">{t("profile.myLearning.sortProgress")}</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state">
          <h4>{t("profile.myLearning.loading")}</h4>
        </div>
      ) : error ? (
        <div className="empty-state">
          <h4>{t("profile.myLearning.loadError")}</h4>
          <p>{error}</p>
        </div>
      ) : sortedCourses.length > 0 ? (
        <>
          <CourseCardGrid
            courses={paginatedCourses}
            onOpenCourse={onOpenCourse}
            variant="mine"
          />

          {totalPages > 1 && (
            <div className="course-pagination">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                <ChevronLeft size={14} />
              </button>

              {pageNumbers.map((page, index) =>
                page === "..." ? (
                  <span key={`ellipsis-${index}`}>...</span>
                ) : (
                  <button
                    key={page}
                    className={safePage === page ? "active" : ""}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      ) : courses.length > 0 ? (
        <div className="empty-state">
          <h4>
            {statusFilter === "completed"
              ? "No completed courses yet"
              : "No courses in progress"}
          </h4>
          <p>
            {statusFilter === "completed"
              ? "Finish all lessons in a course to see it here."
              : "All your enrolled courses are completed — check the Completed tab."}
          </p>
        </div>
      ) : (
        <div className="empty-state">
          <h4>{t("profile.myLearning.emptyTitle")}</h4>
          <p>
            {t("profile.myLearning.emptySubtitle")}
          </p>
          <button onClick={onBack} className="btn btn-primary" type="button">
            {t("profile.myLearning.viewCatalog")}
          </button>
        </div>
      )}
    </div>
  );
};

export default CoursesSection;
