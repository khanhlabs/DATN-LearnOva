import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import {
  buildFavoriteCourses,
  FAVORITE_COURSE_STATUS,
  FAVORITE_COURSE_TABS,
} from "../data/profileData";
import CourseCardGrid from "./CourseCardGrid";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useEffect } from "react";
import { getWishlistApi, removeWishlistApi } from "../../../../../api/WishlistApi.js";
import { getFileUrl } from "../../../../../api/PublicCourseApi.js";



const ITEMS_PER_PAGE = 8;

const TAB_LABEL_KEYS = {
  all: "profile.favorites.tabAll",
  purchased: "profile.favorites.tabPurchased",
  unpurchased: "profile.favorites.tabUnpurchased",
};

const FavoritesSection = ({ onOpenCourse }) => {
  const { t } = useTranslation();
  const [favoriteCourses, setFavoriteCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(FAVORITE_COURSE_TABS[0].id);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");

    const formatPrice = (price) => {
        if (price == null) return "0đ";

        return Number(price).toLocaleString("vi-VN") + "đ";
    };

  // Load wishlist
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        const response = await getWishlistApi();
          console.log("Wishlist Response:", response);
          console.log("Wishlist Data:", response.data);

        const data = await Promise.all(
            response.data.map(async (item) => ({
              id: item.courseId,
              title: item.courseTitle,
              image: item.thumbnail,

              instructor: {
                name: item.instructor,
              },

              category: item.category,
              summary: item.summary,
              progressText: item.progressText,
              remaining: item.remaining,

              price: formatPrice(item.price),
              purchaseStatus: item.purchased
                  ? FAVORITE_COURSE_STATUS.purchased
                  : FAVORITE_COURSE_STATUS.unpurchased,

              rating: item.averageRating,
              reviews: item.reviewCount,
            }))
        );

        setFavoriteCourses(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, []);

  // Remove favorite
  const handleRemoveFavorite = async (courseId) => {
    try {
      await removeWishlistApi(courseId);

      setFavoriteCourses((prev) =>
          prev.filter((course) => course.id !== courseId)
      );

      toast.info(t("profile.favorites.removedFromWishlist"));

    } catch (e) {
      console.error(e);

      toast.error(t("profile.favorites.genericError"));
    }
  };

  const courses = useMemo(() => {
    if (activeTab === FAVORITE_COURSE_STATUS.purchased) {
      return favoriteCourses.filter(
          (course) =>
              course.purchaseStatus === FAVORITE_COURSE_STATUS.purchased
      );
    }

    if (activeTab === FAVORITE_COURSE_STATUS.unpurchased) {
      return favoriteCourses.filter(
          (course) =>
              course.purchaseStatus === FAVORITE_COURSE_STATUS.unpurchased
      );
    }

    return favoriteCourses;
  }, [favoriteCourses, activeTab]);

  const filteredCourses = useMemo(() => {
    if (!searchKeyword.trim()) return courses;

    return courses.filter((course) =>
        course.title
            .toLowerCase()
            .includes(searchKeyword.toLowerCase())
    );
  }, [courses, searchKeyword]);

  const sortedCourses = useMemo(() => {
    const data = [...filteredCourses];

    switch (sortBy) {
      case "oldest":
        return data.reverse();

      case "az":
        return data.sort((a, b) => a.title.localeCompare(b.title));

      case "rating":
        return data.sort((a, b) => b.rating - a.rating);

      default:
        return data;
    }
  }, [filteredCourses, sortBy]);

  const totalPages = Math.max(
      1,
      Math.ceil(sortedCourses.length / ITEMS_PER_PAGE)
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedCourses = sortedCourses.slice(
      (safePage - 1) * ITEMS_PER_PAGE,
      safePage * ITEMS_PER_PAGE
  );

  const pageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from(
          { length: totalPages },
          (_, index) => index + 1
      );
    }

    if (safePage <= 3) {
      return [1, 2, 3, "...", totalPages];
    }

    if (safePage >= totalPages - 2) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", safePage, "...", totalPages];
  }, [safePage, totalPages]);

  const openCourse = (course) => {
    onOpenCourse?.(course);
  };

  if (loading) {
    return <div>{t("profile.favorites.loading")}</div>;
  }

  if (favoriteCourses.length === 0) {
    return (
        <div className="favorite-empty">
          <div className="favorite-empty-icon">💙</div>

          <h2>{t("profile.favorites.emptyTitle")}</h2>

          <p>
            {t("profile.favorites.emptySubtitle")}
          </p>

          <button
              type="button"
              className="favorite-empty-btn"
              onClick={() => (window.location.href = "/learnova/courses")}
          >
            {t("profile.favorites.browseCourses")}
          </button>
        </div>
    );
  }

  return (
    <div className="courses-dashboard">
      <div className="courses-topbar">
        <div>
          <h2>{t("profile.favorites.title")}</h2>
          <div className="course-tabs">
            {FAVORITE_COURSE_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`course-tab ${activeTab === tab.id ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
              >
                {t(TAB_LABEL_KEYS[tab.id])}
              </button>
            ))}
          </div>
        </div>

        <div className="course-tools">
          <label className="course-search">
            <input
                type="text"
                placeholder={t("profile.favorites.searchPlaceholder")}
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
                }}
            />
            <Search size={15} />
          </label>

          <label className="course-sort-field">
            <select
              className="course-sort"
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value);
                setCurrentPage(1);
              }}
              aria-label={t("profile.favorites.sortAria")}
            >
              <option value="newest">{t("profile.favorites.sortNewest")}</option>
              <option value="oldest">{t("profile.favorites.sortOldest")}</option>
              <option value="az">{t("profile.favorites.sortAz")}</option>
              <option value="rating">{t("profile.favorites.sortRating")}</option>
            </select>
            <ChevronDown size={15} />
          </label>
        </div>
      </div>

      <CourseCardGrid
          courses={paginatedCourses}
          onOpenCourse={openCourse}
          onRemoveFavorite={handleRemoveFavorite}
          variant="favorite"
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
      <ToastContainer position="top-right" autoClose={2000} />
    </div>

  );
};

export default FavoritesSection;
