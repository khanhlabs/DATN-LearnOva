import React, { useEffect, useMemo, useRef, useState } from "react";
import "./ProfileView.css";
import AvatarModal from "./components/AvatarModal";
import {
  buildAchievements,
  DEFAULT_ACTIVITIES,
  DEFAULT_PROFILE,
} from "./data/profileData";
import AchievementsSection from "./sections/AchievementsSection.jsx";
import ActivitiesSection from "./sections/ActivitiesSection.jsx";
import CoursesSection from "./sections/CoursesSection";
import LearningCourseDetailSection from "./sections/courseDetail/CourseDetailSection";
import FavoriteCourseDetailSection from "./sections/favoriteCourseDetail/FavoriteCourseDetailSection";
import FavoritesSection from "./sections/FavoritesSection";
import SecuritySection from "./sections/SecuritySection";
import ProfileFormSection from "./sections/ProfileFormSection";
import { getMyEnrolledCoursesApi } from "../../../../api/EnrollmentApi.js";
import { useAuth } from "../../../../hook/UseAuth.jsx";
import { useAxiosPrivate } from "../../../../hook/UseAxiosPrivate.js";
import { getUserProfileApi,updateUserProfileApi,uploadAvatarApi } from "../../../../api/UserApi.js";
import { getUserStatsApi } from "../../../../api/UserStatsApi.js";
import { toast } from "react-toastify";

const EMPTY_STATS = { totalStudyHours: 0, streakDays: 0, enrolledCourseCount: 0, completedCourseCount: 0, points: 0 };

const readStorage = (key, fallback) => {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;

  try {
    return JSON.parse(saved);
  } catch {
    return fallback;
  }
};



const ProfileView = ({
  purchasedCourses = [],
  onStartCourse,
  onBack,
  initialTab = "profile",
}) => {
  const [errors, setErrors] = useState({});
  const axiosPrivate = useAxiosPrivate();
  // const { accessToken, loading: authLoading } = useAuth();
  const activeTab = initialTab;
  const [ownedCourses, setOwnedCourses] = useState(purchasedCourses);
  const [isLoadingCourses, setIsLoadingCourses] = useState(initialTab === "courses");
  const [coursesError, setCoursesError] = useState("");
  const [profileData, setProfileData] = useState(() =>
    readStorage("learnova_user_profile", DEFAULT_PROFILE),
  );
  const [activities, setActivities] = useState(() =>
    readStorage("learnova_user_activities", DEFAULT_ACTIVITIES),
  );

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newLogText, setNewLogText] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const hasMountedRef = useRef(false);

  const validateProfile = () => {
    const newErrors = {};

    if (!profileData.fullName?.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!profileData.phone?.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!/^\d{9,11}$/.test(profileData.phone)) {
      newErrors.phone = "Phone must be 9-11 digits";
    }

    if (!profileData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    }

    if (!profileData.gender) {
      newErrors.gender = "Gender is required";
    }

    return newErrors;
  };
  const {
    accessToken,
    loading: authLoading,
    setCurrentUser,
  } = useAuth();

  const [stats, setStats] = useState(null);

  const achievements = useMemo(
    () => buildAchievements(stats || EMPTY_STATS, profileData, ownedCourses),
    [stats, profileData, ownedCourses],
  );

  useEffect(() => {
    if (authLoading) return;

    let mounted = true;
    getUserStatsApi()
      .then((data) => {
        if (mounted) setStats(data);
      })
      .catch((error) => {
        console.error("Failed to load user stats", error);
        if (mounted) setStats(EMPTY_STATS);
      });

    return () => {
      mounted = false;
    };
  }, [authLoading]);

  useEffect(() => {
    if (authLoading) return;

    const fetchProfile = async () => {
      try {
        const data = await getUserProfileApi();

        setProfileData({
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          avatar: data.avatar || "",
          coverImage: data.coverImage || "",
          dateOfBirth: data.dateOfBirth || "",
          gender: data.gender || "",
          status: data.status || "",
        });
      } catch (error) {
        console.error("Failed to load profile", error);
      }
    };

    fetchProfile();
  }, [authLoading]);

  useEffect(() => {
    if (activeTab !== "courses" && activeTab !== "favorites") return undefined;
    if (authLoading) return undefined;

    let mounted = true;
    setIsLoadingCourses(true);
    setCoursesError("");

    getMyEnrolledCoursesApi(axiosPrivate, accessToken)
        .then((data) => {
          console.log("API:", data);
          console.log("First course:", JSON.stringify(data[0], null, 2));

          if (mounted) {
            setOwnedCourses(Array.isArray(data) ? data.map(mapEnrolledCourse) : []);
          }
        })
      .catch((err) => {
        if (mounted) {
          setOwnedCourses([]);
          setCoursesError(err?.response?.data?.message || "Không tải được khóa học đã mua.");
        }
      })
      .finally(() => {
        if (mounted) setIsLoadingCourses(false);
      });

    return () => {
      mounted = false;
    };
  }, [accessToken, activeTab, authLoading, axiosPrivate]);

  const scrollToPageTop = (behavior = "smooth") => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior });
    });
  };

  useEffect(() => {
    scrollToPageTop("auto");
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    scrollToPageTop();
  }, [activeTab, selectedCourse]);

  const saveProfile = (nextProfile) => {
    localStorage.setItem("learnova_user_profile", JSON.stringify(nextProfile));
    setProfileData(nextProfile);
  };

  const handleInputChange = (field, value) => {
    setProfileData((current) => ({ ...current, [field]: value }));
  };
  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const validationErrors = validateProfile();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }

    setErrors({});

    try {
      const response = await updateUserProfileApi({
        fullName: profileData.fullName,
        phone: profileData.phone,
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender,
        avatar: profileData.avatar,
      });

      setProfileData((prev) => ({
        ...prev,
        ...response,
      }));

      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Update failed!");
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await uploadAvatarApi(formData);

      const avatar = res.avatar || res.url || res;


      setProfileData((prev) => ({
        ...prev,
        avatar,
      }));

      setCurrentUser((prev) => ({
        ...prev,
        avatar,
      }));

      toast.success("Avatar updated!");
    } catch (err) {
      toast.error("Upload failed!");
    }
  };

  const handleSelectAvatar = (url) => {
    saveProfile({ ...profileData, avatar: url });
    setShowAvatarModal(false);
  };

  const handleCustomAvatarSubmit = (event) => {
    event.preventDefault();
    if (!customAvatarUrl.trim()) return;

    handleSelectAvatar(customAvatarUrl.trim());
    setCustomAvatarUrl("");
  };


  const handleAddCustomActivity = (event) => {
    event.preventDefault();
    if (!newLogText.trim()) return;

    const nextActivity = {
      id: Date.now(),
      type: "custom",
      text: newLogText.trim(),
      date: "Just now",
    };
    const nextActivities = [nextActivity, ...activities];
    setActivities(nextActivities);
    localStorage.setItem(
      "learnova_user_activities",
      JSON.stringify(nextActivities),
    );
    setNewLogText("");
  };

  const handleClearActivities = () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your entire activity history?",
      )
    )
      return;

    setActivities([]);
    localStorage.removeItem("learnova_user_activities");
  };

  const handleOpenCourse = (course) => {
    console.log("Clicked:", course);

    setSelectedCourse(course);

    scrollToPageTop();
  };

  const handleCloseCourseDetail = () => {
    setSelectedCourse(null);
    scrollToPageTop();
  };

  const renderContent = () => {
    if (activeTab === "courses") {
      if (selectedCourse) {
        return (
          <LearningCourseDetailSection
            course={selectedCourse}
            onBack={handleCloseCourseDetail}
          />
        );
      }


      return (
        <CoursesSection
          purchasedCourses={ownedCourses}
          isLoading={isLoadingCourses}
          error={coursesError}
          onStartCourse={onStartCourse}
          onOpenCourse={handleOpenCourse}
          onBack={onBack}
        />
      );
    }

    if (activeTab === "favorites") {
      if (selectedCourse) {
        return (
          <FavoriteCourseDetailSection
            course={selectedCourse}
            onBack={handleCloseCourseDetail}
            onStartCourse={onStartCourse}
          />
        );
      }

      return (
        <FavoritesSection
          favoriteCourses={ownedCourses}
          onOpenCourse={handleOpenCourse}
        />
      );
    }

    if (activeTab === "security") {
      return <SecuritySection profileData={profileData} />;
    }

    if (activeTab === "achievements") {
      return (
        <AchievementsSection
          achievements={achievements}
          points={stats ? stats.points : 0}
          onBack={onBack}
        />
      );
    }

    if (activeTab === "activities") {
      return (
        <ActivitiesSection
          activities={activities}
          newLogText={newLogText}
          setNewLogText={setNewLogText}
          onAddCustomActivity={handleAddCustomActivity}
          onClearActivities={handleClearActivities}
        />
      );
    }

    return (
        <ProfileFormSection
            profileData={profileData}
            saveSuccess={saveSuccess}
            onInputChange={handleInputChange}
            onSaveProfile={handleSaveProfile}
            onAvatarChange={handleAvatarChange}
            errors={errors}
        />
    );
  };

  return (
    <div className="profile-view">
      {showAvatarModal && (
        <AvatarModal
          profileData={profileData}
          customAvatarUrl={customAvatarUrl}
          setCustomAvatarUrl={setCustomAvatarUrl}
          onClose={() => setShowAvatarModal(false)}
          onSelectAvatar={handleSelectAvatar}
          onCustomAvatarSubmit={handleCustomAvatarSubmit}
        />
      )}

      <div className="profile-wrapper">
        <main className="profile-main">
          <div className="content-area">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

export default ProfileView;

const formatRemaining = (progress) =>
  progress > 0 ? "Continue learning" : "Not started yet";

const formatDuration = (totalSeconds) => {
  const seconds = Number(totalSeconds ?? 0);
  if (!seconds) return "0h 0m";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${hours}h ${minutes}m`;
};

const formatUpdatedAt = (isoDate) => {
  if (!isoDate) return "";

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  return `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

const mapEnrolledCourse = (course) => ({
  id: course.courseId,
  courseId: course.courseId,
  title: course.title,
  description: course.description,
  summary: course.description || "",
  category: course.categoryName || "",
  tags: course.tags?.length ? course.tags : [],
  about: course.description ? [course.description] : [],
  outcomes: course.whatYouLearn || [],

  instructor: {
    name: course.instructorName || "LearnOva Instructor",
    avatar: course.instructorAvatar || "",
    role: course.instructorHeadline || "Instructor",
    description: course.instructorDescription || "",
    stats: [
      `${Number(course.instructorCourseCount ?? 0)} Courses`,
      `${Number(course.instructorStudentCount ?? 0)} Students`,
      `${Number(course.instructorRating ?? 0).toFixed(1)}/5 Rating`,
    ],
  },

  level: course.level || "All levels",

  image: course.thumbnailKey || "",

  duration: formatDuration(course.totalDurationSeconds),
  updatedAt: formatUpdatedAt(course.updatedAt),

  progress: Number(course.totalLessons) > 0
    ? Math.round((Number(course.completedLessons ?? 0) / Number(course.totalLessons)) * 100)
    : 0,

  lessonsDone: Number(course.completedLessons ?? 0),
  lessonsTotal: Number(course.totalLessons ?? 0),

  remaining: formatRemaining(Number(course.totalLessons) > 0
    ? Math.round((Number(course.completedLessons ?? 0) / Number(course.totalLessons)) * 100)
    : 0),

  rating: Number(course.averageRating ?? 0).toFixed(1),

  reviews: Number(course.reviewCount ?? 0),
  students: Number(course.studentCount ?? 0),

  enrolledAt: course.enrolledAt,
  completedAt: course.completedAt,
});