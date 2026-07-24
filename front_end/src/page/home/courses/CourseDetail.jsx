import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {FaPlay, FaPlayCircle, FaClock, FaGraduationCap, FaCheckCircle, FaUserGraduate, FaGlobe, FaChevronDown, FaChevronUp, FaShoppingCart,} from "react-icons/fa";
import { ChevronDown } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getCourseDetail, getFileUrl } from "../../../api/PublicCourseApi.js";
import { checkEnrollment } from "../../../api/EnrollmentApi.js";
import { useAuth } from "../../../hook/UseAuth.jsx";
import { useAxiosPrivate } from "../../../hook/UseAxiosPrivate.js";
import { addCourseToCart } from "../../../utils/cartStorage.js";
import { createPaymentApi } from "../../../api/PaymentApi.js";
import { applyVoucherApi } from "../../../api/VoucherApi.js";
import PaymentModal from "../../../component/payment/PaymentModal.jsx";
import LearnovaAI from "../chat-bot/chatBot.jsx";

import "./CourseDetail.css";

const formatUsd = (value) => {
  const amount = Number(value) || 0;
  const body = Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2).replace(/\.?0+$/, "");
  return `$${body}`;
};

const formatDuration = (seconds) => {
    if (!seconds) return "0:00";

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
        return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    return `${m}:${String(s).padStart(2, "0")}`;
};

const formatHours = (seconds) => {
    if (!seconds) return "0h";

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);

    if (h > 0) {
        return `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
    }

    return `${m}m`;
};

export default function CourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const {
        accessToken,
        isAuthenticated,
        loading: authLoading,
        currentUser,
    } = useAuth();

    const axiosPrivate = useAxiosPrivate();

    const [course, setCourse] = useState(null);
    const [thumbnailUrl, setThumbnailUrl] = useState(null);
    const [instructorAvatarUrl, setInstructorAvatarUrl] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [enrolled, setEnrolled] = useState(false);

    const [expandedSections, setExpandedSections] = useState([]);
    const [descExpanded, setDescExpanded] = useState(false);

    const [promo, setPromo] = useState("");
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [voucherMessage, setVoucherMessage] = useState("");
    const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

    const [activePayment, setActivePayment] = useState(null);
    const [isCreatingPayment, setIsCreatingPayment] = useState(false);

    useEffect(() => {
        if (!id) return;

        const loadCourse = async () => {
            try {
                setIsLoading(true);

                const data = await getCourseDetail(id);
                setCourse(data);

                if (data.sections?.length > 0) {
                    setExpandedSections([data.sections[0].sectionId]);
                }

                if (data.thumbnailKey) {
                    getFileUrl(data.thumbnailKey)
                        .then(setThumbnailUrl)
                        .catch(() => setThumbnailUrl(null));
                } else {
                    setThumbnailUrl(null);
                }

                if (data.instructor?.avatarKey) {
                    getFileUrl(data.instructor.avatarKey)
                        .then(setInstructorAvatarUrl)
                        .catch(() => setInstructorAvatarUrl(null));
                } else {
                    setInstructorAvatarUrl(null);
                }
            } catch (err) {
                console.error("Failed to load course:", err);
                setCourse(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadCourse();
    }, [id]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPromo("");
        setAppliedVoucher(null);
        setVoucherMessage("");
        setActivePayment(null);
        setEnrolled(false);
    }, [id]);

    useEffect(() => {
        if (!id || !isAuthenticated) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEnrolled(false);
            return;
        }

        checkEnrollment(id)
            .then(setEnrolled)
            .catch(() => setEnrolled(false));
    }, [id, isAuthenticated, currentUser]);

    const toggleSection = (sectionId) => {
        setExpandedSections((prev) =>
            prev.includes(sectionId)
                ? prev.filter((item) => item !== sectionId)
                : [...prev, sectionId],
        );
    };

    const handleVoucherChange = (event) => {
        setPromo(event.target.value);
        setAppliedVoucher(null);
        setVoucherMessage("");
    };

    const handleApplyVoucher = async () => {
        const code = promo.trim();
        const subtotal = Number(course?.basePrice || 0);

        if (!code) {
            const message = "Please enter a voucher code.";
            setVoucherMessage(message);
            toast.error(message);
            return;
        }

        if (!course || subtotal <= 0) {
            const message = !course
                ? "Course not found."
                : "Course does not have a valid price.";
            setVoucherMessage(message);
            toast.error(message);
            return;
        }

        if (appliedVoucher?.code?.toLowerCase() === code.toLowerCase()) {
            const message = "This voucher is already applied.";
            setVoucherMessage(message);
            toast.info(message);
            return;
        }

        try {
            setIsApplyingVoucher(true);
            setVoucherMessage("");

            const result = await applyVoucherApi({
                code,
                subtotal,
            });

            setAppliedVoucher(result);
            setVoucherMessage(`Applied ${result.code}.`);
            toast.success(`Voucher ${result.code} applied.`);
        } catch (err) {
            const message =
                err?.response?.data?.message ||
                "Invalid or unavailable voucher.";

            setAppliedVoucher(null);
            setVoucherMessage(message);
            toast.error(message);
        } finally {
            setIsApplyingVoucher(false);
        }
    };

    const handleAddToCart = async () => {
        if (authLoading || !course) return;

        if (enrolled) {
            toast.info("You already own this course.");
            return;
        }

        try {
            const result = await addCourseToCart(
                {
                    courseId: course.courseId || course.id || id,
                    title: course.title,
                    teacher: course.instructor?.fullName || "LearnOva Instructor",
                    price: Number(course.basePrice || 0),
                    image: thumbnailUrl,
                },
                { isAuthenticated, accessToken },
            );

            if (result.alreadyInCart) {
                toast.info("Already in cart.");
                return;
            }

            toast.success("Added to cart.");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to add to cart.");
        }
    };

    const handleBuyNow = async () => {
        if (authLoading || !course) return;

        if (!isAuthenticated) {
            toast.error("Please log in to checkout.");
            return;
        }

        if (enrolled) {
            toast.info("You already own this course.");
            navigate("/learnova/user/profile/courses");
            return;
        }

        try {
            setIsCreatingPayment(true);

            const payment = await createPaymentApi(
                axiosPrivate,
                {
                    courseId: Number(course.courseId || course.id || id),
                    voucherCode: appliedVoucher?.code || null,
                },
                accessToken,
            );

            // Free / $0 after voucher — already enrolled on server
            if (
                payment?.orderStatus === "PAID" ||
                payment?.paymentStatus === "SUCCESS" ||
                payment?.paymentMethod === "FREE"
            ) {
                setEnrolled(true);
                toast.success("Enrolled successfully. Opening your course…");
                navigate(`/learnova/user/CoursesDetail/${id}`);
                return;
            }

            setActivePayment(payment);
        } catch (err) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Unable to create payment.";

            if (
                err?.response?.status === 409 &&
                message.toLowerCase().includes("already enrolled")
            ) {
                setEnrolled(true);
                toast.info("You already own this course.");
                navigate("/learnova/user/profile/courses");
                return;
            }

            toast.error(message);
        } finally {
            setIsCreatingPayment(false);
        }
    };

    if (isLoading) {
        return <div className="cdp__loading">Loading course...</div>;
    }

    if (!course) {
        return <div className="cdp__loading">Course not found.</div>;
    }

    const descParagraphs = (course.description || "")
        .split(/\n+/)
        .filter(Boolean);

    const visibleParas = descExpanded
        ? descParagraphs
        : descParagraphs.slice(0, 3);

    const subtotal = Number(course.basePrice || 0);
    const discount = Number(appliedVoucher?.discountAmount || 0);
    const total = Math.max(0, subtotal - discount);
    const isOwnCourse = Boolean(
        currentUser?.id && course.instructor?.id && currentUser.id === course.instructor.id
    );

    return (
        <div className="cdp">
            <div className="cdp__hero">
                <div className="cdp__hero-inner">
                    <div className="cdp__breadcrumb">
                        {course.categoryName && <span>{course.categoryName}</span>}
                    </div>

                    <h1 className="cdp__hero-title">{course.title}</h1>

                    <div className="cdp__hero-meta">
                        <span className="cdp__hero-instructor">
                            <FaUserGraduate /> {course.instructor?.fullName}
                        </span>

                        <span className="cdp__hero-stat">
                            <FaPlayCircle /> {course.lessonCount || 0} lessons
                        </span>

                        <span className="cdp__hero-stat">
                            <FaClock /> {formatHours(course.totalDurationSeconds)}
                        </span>

                        <span className="cdp__hero-stat">
                            <FaGraduationCap /> {course.level}
                        </span>

                        {course.language && (
                            <span className="cdp__hero-stat">
                                <FaGlobe /> {course.language}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="cdp__body">
                <div className="cdp__left">
                    {course.whatYouLearn?.length > 0 && (
                        <section className="cdp__section">
                            <h2 className="cdp__section-title">What you'll learn</h2>

                            <ul className="cdp__learn-list">
                                {course.whatYouLearn.map((item, index) => (
                                    <li key={index}>
                                        <FaCheckCircle className="cdp__check-icon" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {descParagraphs.length > 0 && (
                        <section className="cdp__section">
                            <h2 className="cdp__section-title">Course Description</h2>

                            <div className="cdp__desc">
                                {visibleParas.map((item, index) => (
                                    <p key={index}>{item}</p>
                                ))}
                            </div>

                            {descParagraphs.length > 3 && (
                                <button
                                    className="cdp__toggle-btn"
                                    type="button"
                                    onClick={() => setDescExpanded((prev) => !prev)}
                                >
                                    {descExpanded ? (
                                        <>
                                            <FaChevronUp /> Show less
                                        </>
                                    ) : (
                                        <>
                                            <FaChevronDown /> Show more
                                        </>
                                    )}
                                </button>
                            )}
                        </section>
                    )}

                    {course.sections?.length > 0 && (
                        <section className="cdp__section">
                            <h2 className="cdp__section-title">Course Content</h2>

                            <p className="cdp__curriculum-meta">
                                {course.sections.length} sections · {course.lessonCount || 0} lessons ·{" "}
                                {formatHours(course.totalDurationSeconds)} total
                            </p>

                            <div className="cdp__curriculum">
                                {course.sections.map((section, sectionIndex) => {
                                    const isOpen = expandedSections.includes(section.sectionId);

                                    const sectionDuration = (section.lessons || []).reduce(
                                        (sum, lesson) => sum + Number(lesson.durationSeconds || 0),
                                        0,
                                    );

                                    return (
                                        <div
                                            key={section.sectionId}
                                            className="cdp__section-item"
                                        >
                                            <button
                                                className="cdp__section-header"
                                                type="button"
                                                onClick={() => toggleSection(section.sectionId)}
                                            >
                                                <ChevronDown
                                                    size={16}
                                                    className={`cdp__chevron ${
                                                        isOpen ? "cdp__chevron--open" : ""
                                                    }`}
                                                />

                                                <span className="cdp__section-name">
                                                    {sectionIndex + 1}. {section.title}
                                                </span>

                                                <span className="cdp__section-info">
                                                    {(section.lessons || []).length} lessons ·{" "}
                                                    {formatHours(sectionDuration)}
                                                </span>
                                            </button>

                                            {isOpen && (
                                                <ul className="cdp__lesson-list">
                                                    {(section.lessons || []).map((lesson) => (
                                                        <li
                                                            key={lesson.lessonId}
                                                            className="cdp__lesson-item"
                                                        >
                                                            <FaPlay className="cdp__play-icon" />

                                                            <span className="cdp__lesson-title">
                                                                {lesson.title}
                                                            </span>

                                                            {lesson.isPreview && (
                                                                <span className="cdp__preview-badge">
                                                                    Preview
                                                                </span>
                                                            )}

                                                            <span className="cdp__lesson-duration">
                                                                {formatDuration(lesson.durationSeconds)}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {course.requirements?.length > 0 && (
                        <section className="cdp__section">
                            <h2 className="cdp__section-title">Requirements</h2>

                            <ul className="cdp__req-list">
                                {course.requirements.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className="cdp__section">
                        <h2 className="cdp__section-title">Instructor</h2>

                        <div className="cdp__instructor">
                            <div className="cdp__instructor-avatar">
                                {instructorAvatarUrl ? (
                                    <img
                                        src={instructorAvatarUrl}
                                        alt={course.instructor?.fullName}
                                    />
                                ) : (
                                    <div className="cdp__instructor-initials">
                                        {course.instructor?.fullName?.charAt(0) ?? "?"}
                                    </div>
                                )}
                            </div>

                            <div className="cdp__instructor-info">
                                <h3>{course.instructor?.fullName}</h3>
                            </div>
                        </div>
                    </section>
                </div>

                <aside className="cdp__sidebar">
                    <div className="cdp__card">
                        {thumbnailUrl ? (
                            <img
                                src={thumbnailUrl}
                                alt={course.title}
                                className="cdp__card-thumb"
                            />
                        ) : (
                            <div className="cdp__card-thumb cdp__card-thumb--placeholder" />
                        )}

                        <div className="cdp__card-body">
                            <div className="cdp__card-price">
                                {total <= 0 ? "Free" : formatUsd(total)}
                            </div>

                            {discount > 0 && (
                                <div className="course-detail-order-lines">
                                    <div>
                                        <span>Subtotal</span>
                                        <strong>{formatUsd(subtotal)}</strong>
                                    </div>

                                    <div>
                                        <span>Discount</span>
                                        <strong>-{formatUsd(discount)}</strong>
                                    </div>
                                </div>
                            )}

                            {!enrolled && (
                                <div className="course-detail-voucher">
                                    <label htmlFor="course-detail-voucher">
                                        Voucher code
                                    </label>

                                    <div className="course-detail-voucher-input">
                                        <input
                                            id="course-detail-voucher"
                                            type="text"
                                            value={promo}
                                            onChange={handleVoucherChange}
                                            placeholder="Enter voucher"
                                        />

                                        <button
                                            type="button"
                                            onClick={handleApplyVoucher}
                                            disabled={isApplyingVoucher}
                                        >
                                            {isApplyingVoucher ? "..." : "Apply"}
                                        </button>
                                    </div>

                                    {voucherMessage && (
                                        <p
                                            className={`course-detail-voucher-message ${
                                                appliedVoucher ? "success" : "error"
                                            }`}
                                        >
                                            {voucherMessage}
                                        </p>
                                    )}
                                </div>
                            )}

                            {isOwnCourse ? (
                                <p className="cdp__own-course-note">
                                    This is your own course — you cannot purchase a course you teach.
                                </p>
                            ) : enrolled ? (
                                <button
                                    className="cdp__btn cdp__btn--primary"
                                    type="button"
                                    onClick={() =>
                                        navigate(`/learnova/user/CoursesDetail/${id}`)
                                    }
                                >
                                    <FaPlay /> Start Learning
                                </button>
                            ) : (
                                <>
                                    <button
                                        className="cdp__btn cdp__btn--primary"
                                        type="button"
                                        onClick={handleBuyNow}
                                        disabled={isCreatingPayment}
                                    >
                                        {isCreatingPayment ? (
                                            total <= 0 ? "Enrolling..." : "Creating payment..."
                                        ) : total <= 0 ? (
                                            <>
                                                <FaGraduationCap /> Enroll for free
                                            </>
                                        ) : (
                                            <>
                                                <FaShoppingCart /> Buy Now
                                            </>
                                        )}
                                    </button>

                                    <button
                                        className="cdp__btn cdp__btn--outline"
                                        type="button"
                                        onClick={handleAddToCart}
                                    >
                                        <FaShoppingCart /> Add to Cart
                                    </button>
                                </>
                            )}

                            <ul className="cdp__card-features">
                                <li>
                                    <FaPlayCircle /> {course.lessonCount || 0} lessons on-demand
                                </li>

                                <li>
                                    <FaClock /> {formatHours(course.totalDurationSeconds)} total
                                </li>

                                <li>
                                    <FaGraduationCap /> {course.level}
                                </li>

                                {course.language && (
                                    <li>
                                        <FaGlobe /> {course.language}
                                    </li>
                                )}

                                <li>✓ Full lifetime access</li>
                                <li>✓ Certificate of completion</li>
                            </ul>
                        </div>
                    </div>
                </aside>
            </div>

            <div className="chatbot-fixed">
                <LearnovaAI />
            </div>

            {activePayment && (
                <PaymentModal
                    payment={activePayment}
                    onClose={() => setActivePayment(null)}
                />
            )}

            <ToastContainer position="top-right" autoClose={2000} />
        </div>
    );
}