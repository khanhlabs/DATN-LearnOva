import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "./intructor/css/InstructorsPage.css";
import { FaStar, FaCheckCircle } from "react-icons/fa";
import { UserPlus, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import LearnovaAI from "../home/chat-bot/chatBot.jsx";
import { getPublicInstructorsApi } from "../../api/InstructorApi.js";
import { getFollowStatusApi, followInstructorApi, unfollowInstructorApi } from "../../api/FollowApi.js";
import { useAuth } from "../../hook/UseAuth.jsx";
import defaultAvatar from "../../assets/default_avatar.jpg";

const RATING_BUCKETS = [
  { value: 5, label: "5.0" },
  { value: 4.5, label: "4.5+" },
  { value: 4.0, label: "4.0+" },
  { value: 3.5, label: "3.5+" },
];

function InstructorsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const SORT_OPTIONS = [
    { value: "popular", label: t("instructorsPage.sortPopular") },
    { value: "rating", label: t("instructorsPage.sortRating") },
    { value: "students", label: t("instructorsPage.sortStudents") },
    { value: "courses", label: t("instructorsPage.sortCourses") },
  ];

  const getBadge = (instructor) => {
    if (instructor.studentCount >= 10000) return { class: "badge-best-seller", text: t("instructorsPage.badgeBestSeller") };
    if (instructor.rating >= 4.8) return { class: "badge-top-rated", text: t("instructorsPage.badgeTopRated") };
    if (instructor.courseCount > 0) return { class: "badge-verified", text: t("instructorsPage.badgeVerified") };
    return null;
  };

  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [followMap, setFollowMap] = useState({});

  const [selectedExpertise, setSelectedExpertise] = useState([]);
  const [minRating, setMinRating] = useState(null);
  const [activeCategory, setActiveCategory] = useState("Popular");
  const [sortBy, setSortBy] = useState("popular");

  useEffect(() => {
    let mounted = true;

    getPublicInstructorsApi()
      .then((data) => {
        if (mounted) setInstructors(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load instructors", err);
        if (mounted) setError(t("instructorsPage.loadError"));
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || instructors.length === 0) {
      setFollowMap({});
      return;
    }

    let mounted = true;

    Promise.all(
      instructors.map((instructor) =>
        getFollowStatusApi(instructor.instructorId)
          .then((data) => [instructor.instructorId, data])
          .catch(() => [instructor.instructorId, null]),
      ),
    ).then((results) => {
      if (!mounted) return;
      const map = {};
      results.forEach(([id, data]) => {
        if (data) map[id] = data;
      });
      setFollowMap(map);
    });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, instructors]);

  const handleToggleFollow = async (event, instructorId) => {
    event.stopPropagation();

    if (!isAuthenticated) {
      toast.error(t("instructorsPage.loginToFollow"));
      navigate("/learnova/auth/login");
      return;
    }

    const isFollowing = followMap[instructorId]?.following;

    try {
      const data = isFollowing
        ? await unfollowInstructorApi(instructorId)
        : await followInstructorApi(instructorId);

      setFollowMap((prev) => ({ ...prev, [instructorId]: data }));

      if (data.following) {
        toast.success(t("instructorsPage.nowFollowing"));
      }
    } catch (err) {
      console.error("Failed to update follow status", err);
      toast.error(t("instructorsPage.followError"));
    }
  };

  const expertiseOptions = useMemo(() => {
    const counts = new Map();
    instructors.forEach((instructor) => {
      (instructor.expertiseTags || []).forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  }, [instructors]);

  const categories = useMemo(() => {
    const topTags = [...expertiseOptions]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((item) => item.name);
    return ["Popular", ...topTags];
  }, [expertiseOptions]);

  const toggleExpertise = (name) => {
    setSelectedExpertise((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    );
  };

  const filteredInstructors = useMemo(() => {
    let result = instructors.filter((instructor) => {
      const tags = instructor.expertiseTags || [];

      if (activeCategory !== "Popular" && !tags.includes(activeCategory)) {
        return false;
      }

      if (selectedExpertise.length > 0 && !selectedExpertise.some((tag) => tags.includes(tag))) {
        return false;
      }

      if (minRating != null && instructor.rating < minRating) {
        return false;
      }

      return true;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "students") return b.studentCount - a.studentCount;
      if (sortBy === "courses") return b.courseCount - a.courseCount;
      return b.rating * b.reviewCount - a.rating * a.reviewCount;
    });

    return result;
  }, [instructors, activeCategory, selectedExpertise, minRating, sortBy]);

  return (
    <div className="instructors-page">
      <div className="page-container">
        <div className="sidebar-wrapper">
          <aside className="sidebar-in">
            <div className="filter-group-in">
              <div className="filter-title">
                <span>{t("instructorsPage.expertise")}</span>
                <small>{t("instructorsPage.topicsCount", { count: expertiseOptions.length })}</small>
              </div>
              <div className="filter-chip-grid">
                {expertiseOptions.map((item) => (
                  <label key={item.name} className="filter-chip-in">
                    <input
                      type="checkbox"
                      checked={selectedExpertise.includes(item.name)}
                      onChange={() => toggleExpertise(item.name)}
                    />
                    <span className="filter-chip-name">
                      {item.name} ({item.count})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group-in">
              <div className="filter-title">
                <span>{t("instructorsPage.rating")}</span>
                <small>{t("instructorsPage.minimumScore")}</small>
              </div>
              <div className="filter-list">
                <label className="filter-row-in">
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating == null}
                    onChange={() => setMinRating(null)}
                  />
                  <span className="filter-row-main">{t("instructorsPage.allRatings")}</span>
                </label>
                {RATING_BUCKETS.map((item) => (
                  <label key={item.value} className="filter-row-in">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === item.value}
                      onChange={() => setMinRating(item.value)}
                    />
                    <span className="filter-row-main">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <main className="main-content">
          <div className="category-section">
            <span className="tag-label">{t("instructorsPage.popular")}</span>
            <div className="tags">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`tag ${activeCategory === cat ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                  type="button"
                >
                  {cat}
                </button>
              ))}
            </div>
            <label className="sort-control">
              <span>{t("instructorsPage.sortBy")}</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <div className="empty-state">
              <h4>{t("instructorsPage.loading")}</h4>
            </div>
          ) : error ? (
            <div className="empty-state">
              <h4>{error}</h4>
            </div>
          ) : filteredInstructors.length === 0 ? (
            <div className="empty-state">
              <h4>{t("instructorsPage.noResults")}</h4>
            </div>
          ) : (
            <div className="instructors-grid-in">
              {filteredInstructors.map((instructor) => {
                const badge = getBadge(instructor);
                return (
                  <div key={instructor.instructorId} className="instructor-card-in">
                    <div className="card-header-in-in">
                      {badge && <div className={`badge-in-in ${badge.class}`}>{badge.text}</div>}
                    </div>

                    <div className="avatar-wrapper-in">
                      <img
                        src={instructor.avatar?.trim() ? instructor.avatar : defaultAvatar}
                        alt={instructor.fullName}
                        className="avatar"
                      />
                    </div>

                    <h3 className="instructor-name-new">
                      {instructor.fullName}
                      <FaCheckCircle className="check-icon" />
                    </h3>
                    <p className="instructor-title-new-in">
                      {instructor.headline || t("instructorsPage.instructorFallback")}
                    </p>

                    {instructor.expertiseTags?.length > 0 && (
                      <div className="skills-row-in">
                        {instructor.expertiseTags.slice(0, 3).map((skill) => (
                          <span key={skill} className="skill-tag">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="rating-row">
                      <div className="rating">
                        <FaStar className="star-icon" />
                        <span className="rating-value">{instructor.rating.toFixed(1)}</span>
                        <span className="rating-count">
                          ({instructor.reviewCount.toLocaleString()})
                        </span>
                      </div>
                    </div>

                    <p className="bio">{instructor.description || t("instructorsPage.noDescription")}</p>

                    <div className="card-actions">
                      <button
                        className="view-profile-btn"
                        onClick={() => navigate(`/learnova/intructorDetail/${instructor.instructorId}`)}
                      >
                        {t("instructorsPage.viewProfile")}
                      </button>
                      <button
                        className={`message-btn ${followMap[instructor.instructorId]?.following ? "following" : ""}`}
                        onClick={(event) => handleToggleFollow(event, instructor.instructorId)}
                        title={followMap[instructor.instructorId]?.following ? t("instructorsPage.unfollow") : t("instructorsPage.follow")}
                      >
                        {followMap[instructor.instructorId]?.following ? (
                          <UserCheck size={18} />
                        ) : (
                          <UserPlus size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
        <div className="chatbot-fixed">
          <LearnovaAI />
        </div>
      </div>
    </div>
  );
}
export default InstructorsPage;
