import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import "./css/intructorDetail.css";

import {
  FaBookOpen,
  FaFacebook,
  FaGithub,
  FaGlobe,
  FaLinkedin,
  FaStar,
  FaUserFriends,
  FaUserGraduate,
} from "react-icons/fa";

import HeaderIntructor from "./components/headerIntructor";
import MainIntructor from "./components/MainIntructor";
import LearnovaAI from "../../../../home/presentation/chat_bot/chatBot.jsx";

import { getPublicInstructorByIdApi } from "../../../infrastructure/api/InstructorApi";
import { getInstructorProfile } from "../../../infrastructure/api/PublicInstructorApi.js";
import { getFileUrl } from "../../../../course/infrastructure/api/PublicCourseApi";

const DEFAULT_AVATAR =
  "https://api.dicebear.com/7.x/initials/svg?seed=Instructor&backgroundType=gradientLinear";

const SOCIAL_ICONS = {
  website: {
    icon: FaGlobe,
    color: "#0f172a",
  },
  linkedin: {
    icon: FaLinkedin,
    color: "#0A66C2",
  },
  github: {
    icon: FaGithub,
    color: "#24292f",
  },
  facebook: {
    icon: FaFacebook,
    color: "#1877F2",
  },
};

/**
 * Chuyển giá trị sang number an toàn.
 */
const toNumber = (value, fallback = 0) => {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

/**
 * Chuẩn hóa socialLinks vì API có thể trả về object hoặc array.
 */
const normalizeSocialLinks = (socialLinks) => {
  if (!socialLinks) {
    return [];
  }

  if (Array.isArray(socialLinks)) {
    return socialLinks
      .map((social) => {
        const key = social.type?.toLowerCase();
        const config = SOCIAL_ICONS[key];

        if (!config || !social.url) {
          return null;
        }

        return {
          type: key,
          icon: config.icon,
          color: config.color,
          url: social.url,
        };
      })
      .filter(Boolean);
  }

  return Object.entries(socialLinks)
    .filter(([key, url]) => SOCIAL_ICONS[key] && url)
    .map(([key, url]) => ({
      type: key,
      icon: SOCIAL_ICONS[key].icon,
      color: SOCIAL_ICONS[key].color,
      url,
    }));
};

/**
 * Lấy URL file an toàn.
 */
const resolveFileUrl = async (key, fallback = null) => {
  if (!key) {
    return fallback;
  }

  try {
    return await getFileUrl(key);
  } catch (error) {
    console.warn(`Cannot resolve file URL for key: ${key}`, error);
    return fallback;
  }
};

/**
 * Chuẩn hóa dữ liệu của khóa học từ hai API khác nhau.
 */
const normalizeCourses = async (courses = []) => {
  return Promise.all(
    courses.map(async (course) => {
      const existingThumbnail =
        course.thumbnailUrl ||
        course.thumbnail ||
        course.image ||
        course.imageUrl ||
        null;

      const thumbnailUrl = course.thumbnailKey
        ? await resolveFileUrl(course.thumbnailKey, existingThumbnail)
        : existingThumbnail;

      return {
        ...course,

        id: course.id ?? course.courseId,

        title:
          course.title ??
          course.courseTitle ??
          course.name ??
          "",

        thumbnailUrl,
        thumbnail: thumbnailUrl,
        image: thumbnailUrl,

        rating: toNumber(
          course.rating ??
            course.avgRating,
        ),

        reviewCount: toNumber(
          course.reviewCount ??
            course.ratingCount ??
            course.reviews,
        ),
      };
    }),
  );
};

/**
 * Chuẩn hóa dữ liệu instructor để các component con sử dụng thống nhất.
 */
const normalizeInstructor = async (data) => {
  const avatarFallback =
    data.avatar ||
    data.avatarUrl ||
    data.image ||
    DEFAULT_AVATAR;

  const avatar = data.avatarKey
    ? await resolveFileUrl(data.avatarKey, avatarFallback)
    : avatarFallback;

  const courses = await normalizeCourses(data.courses || []);

  const rating = toNumber(
    data.rating ??
      data.avgRating,
  );

  const reviewCount = toNumber(
    data.reviewCount ??
      data.ratingCount ??
      data.totalReviews,
  );

  const expertiseTags =
    data.expertiseTags ||
    data.expertise ||
    [];

  return {
    ...data,

    id:
      data.id ??
      data.instructorId ??
      data.userId,

    fullName:
      data.fullName ||
      data.name ||
      data.displayName ||
      "Instructor",

    name:
      data.fullName ||
      data.name ||
      data.displayName ||
      "Instructor",

    headline:
      data.headline ||
      data.title ||
      "Instructor",

    title:
      data.headline ||
      data.title ||
      "Instructor",

    description:
      data.description ||
      data.bio ||
      data.about ||
      "",

    avatar,
    image: avatar,

    rating,
    avgRating: rating,
    formattedRating: rating.toFixed(1),

    reviewCount,
    ratingCount: reviewCount,

    courseCount: toNumber(
      data.courseCount,
      courses.length,
    ),

    studentCount: toNumber(
      data.studentCount ??
        data.totalStudents,
    ),

    followerCount: toNumber(
      data.followerCount ??
        data.totalFollowers,
    ),

    expertiseTags,
    expertise: expertiseTags,

    courses,

    reviews: data.reviews || [],

    socialLinks: data.socialLinks || {},
    socials: normalizeSocialLinks(data.socialLinks),

    joinedAt:
      data.joinedAt ||
      data.createdAt ||
      null,
  };
};

function InstructorDetail() {
  const { t } = useTranslation();

  const params = useParams();

  // Hỗ trợ cả route /instructor/:id và /instructor/:instructorId
  const instructorId = params.id || params.instructorId;

  const [activeTab, setActiveTab] = useState("overview");
  const [instructor, setInstructor] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!instructorId) {
      setInstructor(null);
      setError(t("instructorDetailPage.notFound"));
      setIsLoading(false);
      return undefined;
    }

    let mounted = true;

    const loadInstructor = async () => {
      setIsLoading(true);
      setError("");

      try {
        let data;

        /*
         * Ưu tiên API mới.
         * Nếu API mới thất bại thì dùng API cũ để không mất chức năng.
         */
        try {
          data = await getPublicInstructorByIdApi(instructorId);
        } catch (newApiError) {
          console.warn(
            "New instructor API failed, trying legacy API.",
            newApiError,
          );

          data = await getInstructorProfile(instructorId);
        }

        const normalizedInstructor =
          await normalizeInstructor(data);

        if (mounted) {
          setInstructor(normalizedInstructor);

          setIsFollowing(
            Boolean(
              data.isFollowing ??
                data.following,
            ),
          );
        }
      } catch (loadError) {
        console.error(
          "Failed to load instructor profile.",
          loadError,
        );

        if (mounted) {
          setInstructor(null);
          setError(
            t("instructorDetailPage.loadError"),
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadInstructor();

    return () => {
      mounted = false;
    };
  }, [instructorId, t]);

  const highlightItems = useMemo(() => {
    if (!instructor) {
      return [];
    }

    return [
      {
        key: "rating",
        icon: FaStar,
        value: instructor.formattedRating,
        label: t("instructorDetailPage.rating"),
      },
      {
        key: "courses",
        icon: FaBookOpen,
        value: instructor.courseCount,
        label: t("instructorDetailPage.courses"),
      },
      {
        key: "students",
        icon: FaUserGraduate,
        value: instructor.studentCount,
        label: t("instructorDetailPage.students"),
      },
      {
        key: "followers",
        icon: FaUserFriends,
        value: instructor.followerCount,
        label: t("instructorDetailPage.followers"),
      },
    ];
  }, [instructor, t]);

  if (isLoading) {
    return (
      <div className="instructor-detail-status">
        {t("instructorDetailPage.loading")}
      </div>
    );
  }

  if (error || !instructor) {
    return (
      <div className="instructor-detail-status">
        {error || t("instructorDetailPage.notFound")}
      </div>
    );
  }

  return (
    <div className="instructor-detail">
      <HeaderIntructor
        instructor={instructor}
        isFollowing={isFollowing}
        setIsFollowing={setIsFollowing}
        introText={instructor.description}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="profile-content">
        <MainIntructor
          activeTab={activeTab}
          description={instructor.description}
          expertise={instructor.expertise}
          expertiseTags={instructor.expertiseTags}
          courses={instructor.courses}
          reviews={instructor.reviews}
          rating={instructor.rating}
          reviewCount={instructor.reviewCount}
        />

        <aside className="sidebar-ina">
          <div className="sidebar-card-contact-card instructor-highlight-card">
            <h3>
              {t("instructorDetailPage.highlights")}
            </h3>

            <p>
              {t(
                "instructorDetailPage.highlightsSummary",
                {
                  name: instructor.fullName,
                },
              )}
            </p>

            <div className="instructor-highlight-grid">
              {highlightItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className="instructor-highlight-item"
                    key={item.key}
                  >
                    <Icon />

                    <strong>{item.value}</strong>

                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>

            {instructor.reviewCount > 0 && (
              <div className="instructor-highlight-review-count">
                {instructor.formattedRating}★{" "}
                {t(
                  "instructorDetailPage.reviewCount",
                  {
                    count: instructor.reviewCount,
                  },
                )}
              </div>
            )}

            {instructor.socials.length > 0 && (
              <div className="instructor-social-links">
                {instructor.socials.map(
                  ({
                    type,
                    icon: SocialIcon,
                    color,
                    url,
                  }) => (
                    <a
                      key={type}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={type}
                      style={{ color }}
                    >
                      <SocialIcon />
                    </a>
                  ),
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="chatbot-fixed">
        <LearnovaAI />
      </div>
    </div>
  );
}

export default InstructorDetail;
