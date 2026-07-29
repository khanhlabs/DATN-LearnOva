import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { FaStar, FaUserGraduate, FaBookOpen, FaUserPlus, FaUserCheck } from "react-icons/fa";
import defaultAvatar from "../../../../../assets/default_avatar.jpg";
import { useAuth } from "../../../../../hook/UseAuth.jsx";
import {
    getFollowStatusApi,
    followInstructorApi,
    unfollowInstructorApi,
} from "../../../../../api/FollowApi.js";
import {
    FaGithub,
    FaFacebook,
    FaLinkedin,
    FaGlobe,
    FaYoutube,
    FaTwitter,
    FaInstagram,
} from "react-icons/fa";

function HeaderIntructor({ instructor, activeTab, setActiveTab }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth();

    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(instructor.followerCount ?? 0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getSocialIcon = (platform) => {
        switch (platform.toLowerCase()) {
            case "github":
                return <FaGithub />;
            case "facebook":
                return <FaFacebook />;
            case "linkedin":
                return <FaLinkedin />;
            case "youtube":
                return <FaYoutube />;
            case "twitter":
                return <FaTwitter />;
            case "instagram":
                return <FaInstagram />;
            case "website":
                return <FaGlobe />;
            default:
                return <FaGlobe />;
        }
    };

    useEffect(() => {
        if (authLoading || !isAuthenticated) return;

        getFollowStatusApi(instructor.instructorId)
            .then((data) => {
                setIsFollowing(data.following);
                setFollowerCount(data.followerCount);
            })
            .catch((err) => console.error("Failed to load follow status", err));
    }, [authLoading, isAuthenticated, instructor.instructorId]);

    const handleToggleFollow = async () => {
        if (authLoading) return;

        if (!isAuthenticated) {
            toast.error(t("instructorDetailPage.loginToFollow"));
            navigate("/learnova/auth/login");
            return;
        }

        setIsSubmitting(true);
        try {
            const data = isFollowing
                ? await unfollowInstructorApi(instructor.instructorId)
                : await followInstructorApi(instructor.instructorId);

            setIsFollowing(data.following);
            setFollowerCount(data.followerCount);

            if (data.following) {
                toast.success(t("instructorDetailPage.nowFollowing", { name: instructor.fullName }));
            }
        } catch (err) {
            console.error("Failed to update follow status", err);
            toast.error(t("instructorDetailPage.followError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="profile-header-in">
            <div className="header-img"></div>

            <div className="profile-header-under">
                <div className="profile-left">
                    <div className="profile-image-container">
                        <img
                            src={instructor.avatar?.trim() ? instructor.avatar : defaultAvatar}
                            alt={instructor.fullName}
                            className="profile-image"
                        />
                    </div>
                </div>

                <div className="profile-center">
                    <div className="profile-name-section">
                        <h1 className="instructor-name-in">{instructor.fullName}</h1>
                    </div>

                    <p className="instructor-title">{instructor.headline || t("instructorDetailPage.instructorFallback")}</p>

                    <div className="profile-info">
                        <div className="info-item">
                            <FaStar className="info-icon" />
                            <span>{t("instructorDetailPage.reviewsCount", { rating: instructor.rating.toFixed(1), count: instructor.reviewCount })}</span>
                        </div>

                        <div className="info-item">
                            <FaUserGraduate className="info-icon" />
                            <span>{t("instructorDetailPage.studentsCount", { count: instructor.studentCount })}</span>
                        </div>

                        <div className="info-item">
                            <FaBookOpen className="info-icon" />
                            <span>{t("instructorDetailPage.coursesCount", { count: instructor.courseCount })}</span>
                        </div>

                        <div className="info-item">
                            <FaUserCheck className="info-icon" />
                            <span>{t("instructorDetailPage.followersCount", { count: followerCount })}</span>
                        </div>
                    </div>

                    {instructor.description && (
                        <p className="instructor-bio-in">{instructor.description}</p>
                    )}
                </div>

                <div className="profile-right">
                    <div className="profile-actions-vertical">
                        <button
                            className={`follow-btn ${isFollowing ? "following" : ""}`}
                            onClick={handleToggleFollow}
                            disabled={isSubmitting}
                            type="button"
                        >
                            {isFollowing ? (
                                <>
                                    <FaUserCheck />
                                    {t("instructorDetailPage.following")}
                                </>
                            ) : (
                                <>
                                    <FaUserPlus />
                                    {t("instructorDetailPage.follow")}
                                </>
                            )}
                        </button>

                        {instructor.socialLinks && Object.keys(instructor.socialLinks).length > 0 && (
                            <div className="social-links-in">
                                {Object.entries(instructor.socialLinks).map(([platform, url]) => (
                                    <a
                                        key={platform}
                                        href={url}
                                        className="social-link-in"
                                        title={platform}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {getSocialIcon(platform)}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <hr className="hr-in" />

            <div className="instructor-tabs-in">
                <button
                    className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    {t("instructorDetailPage.tabOverview")}
                </button>

                <button
                    className={`tab-btn ${activeTab === "about" ? "active" : ""}`}
                    onClick={() => setActiveTab("about")}
                >
                    {t("instructorDetailPage.tabAbout")}
                </button>

                <button
                    className={`tab-btn ${activeTab === "courses" ? "active" : ""}`}
                    onClick={() => setActiveTab("courses")}
                >
                    {t("instructorDetailPage.tabCourses")}
                </button>

                <button
                    className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
                    onClick={() => setActiveTab("reviews")}
                >
                    {t("instructorDetailPage.tabReviews")}
                </button>
            </div>
        </div>
    );
}

export default HeaderIntructor;
