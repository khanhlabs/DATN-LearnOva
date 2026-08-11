import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./css/Course.css";
import { BiHeart, BiSolidHeart, BiCart } from "react-icons/bi";
import { FaStar } from "react-icons/fa";
import { X } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import LearnovaAI from "../../home/chat_bot/chatBot.jsx";
// import { useAuth } from "../../../hook/useAuth.jsx";
// import { addCourseToCart } from "../../../utils/cartStorage.js";
// import { getActiveCategories } from "../../../api/teacher/CoursesApi.js";
// import { getPublicCoursesApi, voiceSearchCoursesApi } from "../../../api/courses/CourseApi.js";
// import { getFileUrl } from "../../../api/public/CoursesApi.js";
import LearnovaAI from "../../../home/presentation/chat_bot/chatBot";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { addCourseToCart } from "../../../../shared/utils/cartStorage";
import { getPublicCoursesApi, voiceSearchCoursesApi } from "../../infrastructure/api/CourseApi";
import { getActiveCategories } from "../../../instructor/infrastructure/api/teacher/CoursesApi";
import { getFileUrl } from "../../../../shared/api/public/CoursesApi";
import {
  addWishlistApi,
  removeWishlistApi,
  getWishlistApi,
  syncWishlistApi,
} from "../../infrastructure/api/WishlistApi";

const formatUsd = (value) => {
  const amount = Number(value) || 0;
  const body = Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2).replace(/\.?0+$/, "");
  return `$${body}`;
};

const FALLBACK_THUMBS = [
  "linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)",
  "linear-gradient(135deg, #4361ee 0%, #7209b7 100%)",
  "linear-gradient(135deg, #f72585 0%, #b5179e 100%)",
  "linear-gradient(135deg, #06d6a0 0%, #118ab2 100%)",
  "linear-gradient(135deg, #8338ec 0%, #3a0ca3 100%)",
  "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  "linear-gradient(135deg, #10b981 0%, #047857 100%)",
];

const levels = [
  { id: "beginner", name: "Beginner", count: 124 },
  { id: "intermediate", name: "Intermediate", count: 156 },
  { id: "advanced", name: "Advanced", count: 78 },
];

function formatCount(num) {
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(".0", "")}k`;
  return String(num);
}

const AVATAR_COLORS = ['#1E40AF','#065F46','#5B21B6','#0369A1','#9D174D','#9A3412','#0F766E','#92400E'];

function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const formatDuration = (seconds) => {
  if (!seconds) return "0h";
  const hours = seconds / 3600;
  return hours >= 1 ? `${Math.round(hours)}h` : `${Math.round(seconds / 60)}m`;
};

const mapPublicCourse = (course) => ({
  id: course.courseId,
  courseId: course.courseId,
  title: course.title,
  instructor: course.instructorName || "LearnOva Instructor",
  category: course.categoryName || "Uncategorized",
  rating: Number(course.avgRating || 0),
  reviews: course.ratingCount || 0,
  price: Number(course.basePrice || 0),
  duration: formatDuration(course.totalDurationSeconds),
  studentCount: course.studentCount || 0,
  thumbnailKey: course.thumbnailKey,
  level: course.level || "Intermediate",
});

function FilterChip({ label, onRemove }) {
  return (
    <span className="filter-chip">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}>
        <X size={12} />
      </button>
    </span>
  );
}

function CoursesPage() {
  const { t } = useTranslation();
  const { isAuthenticated, accessToken, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [dbCourses, setDbCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [viewMode, setViewMode] = useState("grid");

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [voiceCourseIds, setVoiceCourseIds] = useState(null);
  const [voiceFilters, setVoiceFilters] = useState(null);
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);

  useEffect(() => {
    let mounted = true;

    getActiveCategories()
      .then((data) => {
        if (mounted) setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (mounted) setCategories([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const categoryOptions = useMemo(
    () => [
      { id: "all", name: t("coursesPage.allCategories") },
      ...categories.map((category) => ({
        id: String(category.id),
        name: category.name,
      })),
    ],
    [categories, t],
  );

  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
    setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    const loadingToastId = toast.loading(t("coursesPage.loading"));

    getPublicCoursesApi()
      .then(async (data) => {
        const mapped = Array.isArray(data) ? data.map(mapPublicCourse) : [];
        const withThumbs = await Promise.all(
          mapped.map(async (course, idx) => {
            let image = FALLBACK_THUMBS[idx % FALLBACK_THUMBS.length];
            if (course.thumbnailKey) {
              try {
                image = await getFileUrl(course.thumbnailKey);
              } catch {
                // keep fallback gradient
              }
            }
            return { ...course, image };
          }),
        );
        if (!mounted) return;
        setDbCourses(withThumbs);
        if (withThumbs.length === 0) {
          toast.update(loadingToastId, {
            render: t("coursesPage.noCourses"),
            type: "info",
            isLoading: false,
            autoClose: 2000,
          });
        } else {
          toast.dismiss(loadingToastId);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setDbCourses([]);
        toast.update(loadingToastId, {
          render: t("coursesPage.genericError"),
          type: "error",
          isLoading: false,
          autoClose: 2000,
        });
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
      toast.dismiss(loadingToastId);
    };
  }, [t]);

  const displayCourses = useMemo(() => {
    let result = dbCourses;

    if (voiceCourseIds) {
      const voiceOrder = new Map(voiceCourseIds.map((id, index) => [id, index]));
      result = result
        .filter((course) => voiceOrder.has(course.courseId))
        .sort((left, right) => voiceOrder.get(left.courseId) - voiceOrder.get(right.courseId));
    }

    const trimmedSearch = searchTerm.trim().toLowerCase();
    if (trimmedSearch) {
      result = result.filter(
        (course) =>
          course.title?.toLowerCase().includes(trimmedSearch) ||
          course.instructor?.toLowerCase().includes(trimmedSearch) ||
          course.category?.toLowerCase().includes(trimmedSearch),
      );
    }

    if (selectedCategories.length > 0 && !selectedCategories.includes("all")) {
      const selectedCategoryNames = selectedCategories
        .map((id) => categoryOptions.find((cat) => cat.id === id)?.name?.toLowerCase())
        .filter(Boolean);

      result = result.filter((course) =>
        selectedCategoryNames.includes((course.category || "").toLowerCase()),
      );
    }

    if (selectedLevels.length > 0) {
      const selectedLevelNames = selectedLevels
        .map((id) => levels.find((lvl) => lvl.id === id)?.name?.toLowerCase())
        .filter(Boolean);

      result = result.filter((course) =>
        selectedLevelNames.includes((course.level || "").toLowerCase()),
      );
    }

    return result;
  }, [dbCourses, selectedCategories, selectedLevels, searchTerm, categoryOptions, voiceCourseIds]);

  const runVoiceSearch = async (query) => {
    setIsVoiceSearching(true);
    try {
      const data = await voiceSearchCoursesApi(query);
      setVoiceCourseIds((data.courses || []).map((course) => course.courseId));
      setVoiceFilters({
        ...(data.filters || {}),
        interpretedQuery: data.interpretedQuery || query,
      });
      setSearchTerm(data.filters?.keyword || "");
      setSelectedCategories([]);
      setSelectedLevels([]);
      setCurrentPage(1);
    } catch (error) {
      toast.error(error.response?.data?.message || t("coursesPage.voiceSearchFailed"));
    } finally {
      setIsVoiceSearching(false);
    }
  };

  useEffect(() => {
    const voiceQuery = searchParams.get("voiceQuery")?.trim();
    if (voiceQuery) runVoiceSearch(voiceQuery);
  }, [searchParams]);

  const clearVoiceSearch = () => {
    setVoiceCourseIds(null);
    setVoiceFilters(null);
    setSearchTerm("");
    setSelectedCategories([]);
    setSelectedLevels([]);
    setCurrentPage(1);
  };

  const coursesPerPage = 8;
  const totalPages = Math.ceil(displayCourses.length / coursesPerPage);
  const startIndex = (currentPage - 1) * coursesPerPage;
  const visibleCourses = displayCourses.slice(startIndex, startIndex + coursesPerPage);

  const activeFilters = [
    ...selectedCategories
      .filter((id) => id !== "all")
      .map((id) => categoryOptions.find((c) => c.id === id)?.name)
      .filter(Boolean),
    ...selectedLevels.map((id) => levels.find((l) => l.id === id)?.name).filter(Boolean),
  ];

  const toggleCategory = (id) => {
    setCurrentPage(1);

    if (id === "all") {
      setSelectedCategories(["all"]);
      return;
    }
    setSelectedCategories((prev) => {
      const withoutAll = prev.filter((c) => c !== "all");
      return withoutAll.includes(id)
        ? withoutAll.filter((c) => c !== id)
        : [...withoutAll, id];
    });
  };

  const toggleLevel = (id) => {
    setCurrentPage(1);
    setSelectedLevels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  };

  const removeFilter = (name) => {
    const cat = categoryOptions.find((c) => c.name === name);
    if (cat) {
      setSelectedCategories((prev) => prev.filter((id) => id !== cat.id));
      return;
    }
    const lvl = levels.find((l) => l.name === name);
    if (lvl) setSelectedLevels((prev) => prev.filter((id) => id !== lvl.id));
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedLevels([]);
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedLevels([]);
  };

  useEffect(() => {
    const loadWishlist = async () => {
      try {
        if (isAuthenticated) {
          const response = await getWishlistApi();
          setWishlist(response.data.map((item) => item.courseId));
        } else {
          const favorites =
            JSON.parse(localStorage.getItem("favoriteCourses")) || [];
          setWishlist(favorites);
        }
      } catch (e) {
        console.log(e);
      }
    };

    loadWishlist();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const syncWishlist = async () => {
      try {
        const localFavorites =
          JSON.parse(localStorage.getItem("favoriteCourses")) || [];

        if (localFavorites.length > 0) {
          await syncWishlistApi(localFavorites);
          localStorage.removeItem("favoriteCourses");
        }

        const response = await getWishlistApi();
        setWishlist(response.data.map((item) => item.courseId));
      } catch (e) {
        console.log(e);
      }
    };

    syncWishlist();
  }, [isAuthenticated]);

  const toggleWishlist = async (courseId) => {
    if (authLoading) return;

    if (!isAuthenticated) {
      const favorites =
        JSON.parse(localStorage.getItem("favoriteCourses")) || [];

      let newFavorites;

      if (favorites.includes(courseId)) {
        newFavorites = favorites.filter((id) => id !== courseId);
        toast.info(t("coursesPage.removedFromWishlist"));
      } else {
        newFavorites = [...favorites, courseId];
        toast.success(t("coursesPage.addedToWishlist"));
      }

      localStorage.setItem("favoriteCourses", JSON.stringify(newFavorites));
      setWishlist(newFavorites);
      return;
    }

    try {
      if (wishlist.includes(courseId)) {
        await removeWishlistApi(courseId);
        setWishlist((prev) => prev.filter((id) => id !== courseId));
        toast.info(t("coursesPage.removedFromWishlist"));
      } else {
        await addWishlistApi(courseId);
        setWishlist((prev) => [...prev, courseId]);
        toast.success(t("coursesPage.addedToWishlist"));
      }
    } catch (e) {
      if (
        e.response?.data?.message === "Course already exists in wishlist"
      ) {
        const response = await getWishlistApi();
        setWishlist(response.data.map((item) => item.courseId));
        toast.info(t("coursesPage.alreadyInWishlist"));
        return;
      }

      console.error(e);
      toast.error(t("coursesPage.genericError"));
    }
  };

  const handleAddToCart = async (course) => {
    if (authLoading) return;

    if (!course.courseId) {
      toast.error(t("coursesPage.courseNotAvailable"));
      return;
    }

    try {
      const result = await addCourseToCart(
        {
          courseId: course.courseId,
          title: course.title,
          teacher: course.instructor,
          price: course.price,
          image: course.image,
        },
        { isAuthenticated, accessToken },
      );

      if (result.alreadyInCart) {
        toast.info(t("coursesPage.alreadyInCart"));
        return;
      }

      toast.success(t("coursesPage.addedToCart"));
    } catch (err) {
      toast.error(err?.response?.data?.message || t("coursesPage.genericError"));
    }
  };

  return (
    <div className="courses-page">
      <div className="courses-container">
        <aside className="sidebar-filter-course">
          <div className="sidebar-card">

            <div className="filter-scroll-course">
              <div className="filter-group-course">
                <div className="filter-title-course">
                  <span>{t("coursesPage.categories")}</span>
                </div>
                {categoryOptions.map((cat) => (
                  <label key={cat.id} className="filter-item-course">
                    <div className="left-course">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                      />
                      <span className="filter-name-course">{cat.name}</span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="filter-group-course">
                <div className="filter-title-course">
                  <span>{t("coursesPage.level")}</span>
                </div>
                {levels.map((lvl) => (
                  <label key={lvl.id} className="filter-item-course">
                    <div className="left-course">
                      <input
                        type="checkbox"
                        checked={selectedLevels.includes(lvl.id)}
                        onChange={() => toggleLevel(lvl.id)}
                      />
                      <span>{lvl.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="main-content">
          <div className="courses-toolbar">

            <div className="toolbar-right">
              <input
                type="text"
                className="courses-search-input"
                placeholder={t("coursesPage.searchPlaceholder")}
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setVoiceCourseIds(null);
                  setVoiceFilters(null);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {voiceFilters && (
            <div className="voice-search-summary">
              <span>{t("coursesPage.voiceSearchUnderstood")}</span>
              {voiceFilters.keyword && <strong>{t("coursesPage.keywordLabel")}: {voiceFilters.keyword}</strong>}
              {voiceFilters.instructor && <strong>{t("coursesPage.instructorLabel")}: {voiceFilters.instructor}</strong>}
              {voiceFilters.category && <strong>{t("coursesPage.categoryLabel")}: {voiceFilters.category}</strong>}
              {voiceFilters.courseType && <strong>{t("coursesPage.typeLabel")}: {voiceFilters.courseType === "free" ? t("coursesPage.freeCourses") : t("coursesPage.paidCourses")}</strong>}
              {voiceFilters.level && <strong>{t("coursesPage.levelLabel")}: {voiceFilters.level}</strong>}
              {voiceFilters.minPrice != null && <strong>{t("coursesPage.priceLabel")}: ≥ ${voiceFilters.minPrice}</strong>}
              {voiceFilters.maxPrice != null && <strong>{t("coursesPage.priceLabel")}: ≤ ${voiceFilters.maxPrice}</strong>}
              {voiceFilters.minRating != null && <strong>{t("coursesPage.ratingLabel")}: ★ {voiceFilters.minRating}+</strong>}
              {voiceFilters.minDurationMinutes != null && <strong>≥ {voiceFilters.minDurationMinutes}m</strong>}
              {voiceFilters.maxDurationMinutes != null && <strong>≤ {voiceFilters.maxDurationMinutes}m</strong>}
              {voiceFilters.minStudents != null && <strong>≥ {voiceFilters.minStudents} {t("coursesPage.students")}</strong>}
              {!voiceFilters.keyword && !voiceFilters.instructor && !voiceFilters.category && !voiceFilters.courseType && !voiceFilters.level && voiceFilters.minPrice == null && voiceFilters.maxPrice == null && voiceFilters.minRating == null && voiceFilters.minDurationMinutes == null && voiceFilters.maxDurationMinutes == null && voiceFilters.minStudents == null && (
                <strong>{t("coursesPage.requestLabel")}: {voiceFilters.interpretedQuery}</strong>
              )}
              <button type="button" onClick={clearVoiceSearch}>
                {t("coursesPage.clearVoiceSearch")}
              </button>
            </div>
          )}

          {isLoading || isVoiceSearching ? (
            <div className="voice-results-loading" role="status" aria-live="polite">
              <div className="voice-results-spinner" />
              <strong>{isVoiceSearching ? t("coursesPage.voiceSearchLoading") : t("coursesPage.loading")}</strong>
              <span>{isVoiceSearching ? t("coursesPage.voiceSearchLoadingHint") : ""}</span>
            </div>
          ) : visibleCourses.length === 0 ? (
            <div className="courses-empty-state">
              {t("coursesPage.noCourses")}
            </div>
          ) : (
            <div className={`courses-grid ${viewMode === "list" ? "courses-grid--list" : ""}`}>
              {visibleCourses.map((course) => (
                <div key={course.id} className="course-card-course">
                  <Link to={`/learnova/courses/detail/${course.courseId}`} className="course-card-img">
                    <img src={course.image} alt={course.title} />
                    <button
                      type="button"
                      className={`course-wishlist ${wishlist.includes(course.id) ? "active" : ""}`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        toggleWishlist(course.id);
                      }}
                      aria-label={t("coursesPage.wishlistAria")}
                    >
                      {wishlist.includes(course.id) ? <BiSolidHeart /> : <BiHeart />}
                    </button>
                    {course.studentCount > 0 && (
                      <span className="course-tag-badge course-tag-badge--bestseller">
                        {t("coursesPage.bestseller")}
                      </span>
                    )}
                    {course.duration && (
                      <span className="course-duration-badge">{course.duration}</span>
                    )}
                  </Link>

                  <div className="course-card-body">
                    <Link to={`/learnova/courses/detail/${course.courseId}`} className="course-title">
                      <h3>{course.title}</h3>
                    </Link>

                    <div className="course-instructor-row">
                      <div
                        className="course-instructor-avatar-initials"
                        style={{ background: getAvatarColor(course.instructor) }}
                        aria-hidden="true"
                      >
                        {getInitials(course.instructor)}
                      </div>
                      <span className="course-author">{course.instructor}</span>
                    </div>

                    <div className="course-rating">
                      <span className="course-rating-value">{course.rating.toFixed(1)}</span>
                      <div className="course-rating-stars">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <FaStar
                            key={i}
                            className={`rating-star-icon${i > Math.round(course.rating) ? " rating-star-empty" : ""}`}
                          />
                        ))}
                      </div>
                      <span className="course-reviews">({formatCount(course.reviews)})</span>
                    </div>

                    <div className="course-card-bottom">
                      <div className="course-price-block">
                        <span className="course-price">{formatUsd(course.price)}</span>
                      </div>
                      <button
                        type="button"
                        className="enroll-btn enroll-btn--cart"
                        aria-label={t("coursesPage.addToCartAria")}
                        onClick={() => handleAddToCart(course)}
                      >
                        <BiCart />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pagination-section" aria-label="Courses pagination">
            <button
              type="button"
              className="pagination-item"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`pagination-item ${currentPage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="pagination-item"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
            >
              ›
            </button>
          </div>
        </main>
      </div>

      <div className="chatbot-fixed">
        <LearnovaAI />
      </div>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
}

export default CoursesPage;
