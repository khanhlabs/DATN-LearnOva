import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {BookOpen, Clock, FileText, Globe, GraduationCap, Info, List, MessageSquare, PlayCircle, Star, Tag, Users, BarChart2, CheckCircle, ChevronDown, ChevronRight, Circle, DollarSign, X,} from "lucide-react";
import axiosClient from "../../../../../shared/api-client/AxiosClient";
import { getFileUrl } from "../../../../../shared/api/public/CoursesApi";
import CourseVideoPlayer from "../../../../course/presentation/user/courses_detail/components/tabs/video/VideoPlayer";
import "./CourseTable.css";

const pageSize = 10;
const thumbnailUrlCache = new Map();

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "$0";
  const body = Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2).replace(/\.?0+$/, "");
  return `$${body}`;
};

const useCourseThumbnail = (thumbnailKeyFromDatabase) => {
  const [signedThumbnailUrl, setSignedThumbnailUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const thumbnailKey = thumbnailKeyFromDatabase?.trim();

    const loadThumbnailFromS3 = async () => {
      if (!thumbnailKey) return;

      try {
        let thumbnailUrl = thumbnailUrlCache.get(thumbnailKey);

        if (!thumbnailUrl) {
          const response = await axiosClient.get("/admin/courses-management/thumbnail-url", {
            params: { thumbnailKey },
          });
          thumbnailUrl = response.data?.url || null;
          if (thumbnailUrl) thumbnailUrlCache.set(thumbnailKey, thumbnailUrl);
        }

        if (isMounted) setSignedThumbnailUrl(thumbnailUrl);
      } catch {
        if (isMounted) setSignedThumbnailUrl(null);
      }
    };

    loadThumbnailFromS3();
    return () => { isMounted = false; };
  }, [thumbnailKeyFromDatabase]);

  return signedThumbnailUrl;
};

const valueOrDash = (value) => {
  if (value === null || value === undefined || value === "") return "--";
  return value;
};

const formatPrice = (value) => {
  if (value === null || value === undefined || value === "") return "--";
  const price = Number(value || 0);
  if (price === 0) return "Free";
  return formatCurrency(price);
};

const formatCount = (value) => new Intl.NumberFormat("vi-VN").format(Number(value) || 0);

const formatDuration = (seconds) => {
  const totalSeconds = Number(seconds || 0);
  if (!totalSeconds) return "--";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
};

const timeAgo = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString("vi-VN");
};

const getCourseDisplayStatus = (course) => course.status || "N/A";

const detailTabs = [
  { id: "overview", label: "Overview", Icon: BarChart2 },
  { id: "description", label: "Description", Icon: FileText },
  { id: "curriculum", label: "Curriculum", Icon: List },
];

const CourseViewModal = ({
  course,
  onClose,
  focusLessonId = null,
  enableVideoPreview = false,
  extraTabs = [],
  initialTab = null,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTab || "overview");
  const [expandedSections, setExpandedSections] = useState({});
  const [previewLesson, setPreviewLesson] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const thumbnailUrl = useCourseThumbnail(course?.thumbnailKey);
  const allTabs = [...detailTabs, ...(Array.isArray(extraTabs) ? extraTabs : [])];

  useEffect(() => {
    const sections = Array.isArray(course?.sections) ? course.sections : [];
    let focusSectionId = sections[0]?.sectionId;
    let focusedLesson = null;
    if (focusLessonId != null) {
      for (const section of sections) {
        const hit = (section.lessons || []).find(
          (lesson) => String(lesson.lessonId) === String(focusLessonId),
        );
        if (hit) {
          focusSectionId = section.sectionId;
          focusedLesson = hit;
          break;
        }
      }
    }
    const preferredTab =
      initialTab || (focusLessonId != null ? "curriculum" : "overview");
    setActiveTab(preferredTab);
    setExpandedSections(focusSectionId ? { [focusSectionId]: true } : {});
    setPreviewLesson(null);
    setPreviewUrl("");
    setPreviewError("");

    if (!enableVideoPreview || !focusedLesson?.videoKey) return undefined;

    let alive = true;
    setPreviewLesson(focusedLesson);
    setPreviewLoading(true);
    getFileUrl(focusedLesson.videoKey)
      .then((url) => {
        if (alive) setPreviewUrl(url);
      })
      .catch(() => {
        if (alive) setPreviewError("Could not load video preview.");
      })
      .finally(() => {
        if (alive) setPreviewLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [course?.id, focusLessonId, enableVideoPreview, initialTab]);

  if (!course) return null;

  const sections = Array.isArray(course.sections) ? course.sections : [];
  const lessonCount = course.lessonCount ?? sections.reduce((total, section) => total + (section.lessons?.length || 0), 0);
  const title = course.title || "Untitled course";
  const status = getCourseDisplayStatus(course);
  const isDeleted = status === "DELETED";
  const isPublished = status === "PUBLISHED";
  const categoryName = course.categoryName || "--";
  const totalDurationSeconds = course.totalDurationSeconds ?? 0;

  const toggleSection = (sectionId) => {
    setExpandedSections((current) => ({ ...current, [sectionId]: !current[sectionId] }));
  };

  const openLessonPreview = async (lesson) => {
    if (!enableVideoPreview || !lesson?.videoKey) return;
    setPreviewLesson(lesson);
    setPreviewUrl("");
    setPreviewError("");
    setPreviewLoading(true);
    try {
      const url = await getFileUrl(lesson.videoKey);
      setPreviewUrl(url);
    } catch {
      setPreviewError("Could not load video preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="cdm-overlay adminCourseDetailOverlay" role="presentation" onClick={onClose}>
      <div className="cdm adminCourseDetailModal" role="dialog" aria-modal="true" aria-label="View Course" onClick={(event) => event.stopPropagation()}>
        <div className="cdm__thumbnail-wrap">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title} className="cdm__thumbnail-img" />
          ) : null}
          <button type="button" className="cdm__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="cdm__header-info">
          <div className="cdm__badges">
            <span className={`cdm__badge cdm__badge--${isDeleted ? "inactive" : "active"}`}>
              <Circle size={7} fill="currentColor" />
              {isDeleted ? "Inactive" : "Active"}
            </span>
            <span className={`cdm__badge cdm__badge--${isPublished ? "published" : "draft"}`}>
              {status}
            </span>
            {course.level ? (
              <span className="cdm__badge cdm__badge--level">
                <GraduationCap size={11} />
                {course.level}
              </span>
            ) : null}
            {course.language ? (
              <span className="cdm__badge cdm__badge--lang">
                <Globe size={11} />
                {course.language}
              </span>
            ) : null}
          </div>
          <h2 className="cdm__title">{title}</h2>
          <p className="cdm__category">
            <Tag size={13} />
            {categoryName}
          </p>
        </div>

        <div className="cdm__tabs">
          {allTabs.map(({ id, label, Icon }) => {
            const DetailIcon = Icon;
            return (
              <button
                key={id}
                type="button"
                className={`cdm__tab${activeTab === id ? " cdm__tab--active" : ""}`}
                onClick={() => setActiveTab(id)}
              >
                <DetailIcon size={14} />
                {label}
              </button>
            );
          })}
        </div>

        <div className="cdm__body">
          <>
              {activeTab === "overview" ? (
                <div className="cdm__tab-content">
                  <div className="cdm__stats-grid">
                    {[
                      { Icon: Users, color: "blue", label: "Students", value: valueOrDash(course.studentCount) },
                      { Icon: Clock, color: "green", label: "Duration", value: formatDuration(totalDurationSeconds) },
                      { Icon: BookOpen, color: "violet", label: "Lessons", value: formatCount(lessonCount) },
                      { Icon: Star, color: "gold", label: "Rating", value: valueOrDash(course.rating) },
                      { Icon: DollarSign, color: "teal", label: "Price", value: formatPrice(course.basePrice) },
                      { Icon: MessageSquare, color: "orange", label: "Reviews", value: valueOrDash(course.reviewCount) },
                    ].map(({ Icon, color, label, value }) => {
                      const StatIcon = Icon;
                      return (
                        <div key={label} className="cdm__stat-card">
                          <div className={`cdm__stat-icon cdm__stat-icon--${color}`}>
                            <StatIcon size={18} />
                          </div>
                          <div>
                            <span>{label}</span>
                            <strong>{value}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="cdm__info-table">
                    {[
                      ["Instructor", course.instructorName || "--"],
                      ["Level", course.level || "--"],
                      ["Language", course.language || "--"],
                      ["Category", categoryName],
                      ["Sections", sections.length || "--"],
                      ["Status", status],
                      ["Created", timeAgo(course.publishedAt)],
                    ].map(([key, value]) => (
                      <div key={key} className="cdm__info-row">
                        <span>{key}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTab === "description" ? (
                <div className="cdm__tab-content">
                  {course.description ? (
                    <section className="cdm__section">
                      <h3 className="cdm__section-title">Description</h3>
                      <p className="cdm__description">{course.description}</p>
                    </section>
                  ) : (
                    <div className="cdm__empty">No description added yet.</div>
                  )}

                  {(course.whatYouLearn || []).filter(Boolean).length > 0 ? (
                    <section className="cdm__section">
                      <h3 className="cdm__section-title">What You'll Learn</h3>
                      <ul className="cdm__learn-list">
                        {course.whatYouLearn.filter(Boolean).map((item, index) => (
                          <li key={`${item}-${index}`}>
                            <CheckCircle size={15} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  {(course.requirements || []).filter(Boolean).length > 0 ? (
                    <section className="cdm__section">
                      <h3 className="cdm__section-title">Requirements</h3>
                      <ul className="cdm__req-list">
                        {course.requirements.filter(Boolean).map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              ) : null}

              {activeTab === "curriculum" ? (
                <div className="cdm__tab-content">
                  {enableVideoPreview ? (
                    <div className="cdm__video-preview">
                      {previewLoading ? (
                        <p className="cdm__empty">Loading reported video…</p>
                      ) : previewError ? (
                        <p className="cdm__empty">{previewError}</p>
                      ) : previewUrl ? (
                        <>
                          <p className="cdm__curriculum-summary">
                            Playing: {previewLesson?.title || "Lesson"}
                            {focusLessonId &&
                            String(previewLesson?.lessonId) === String(focusLessonId)
                              ? " (reported)"
                              : ""}
                          </p>
                          <div className="cdm__video-player-wrap">
                            <CourseVideoPlayer src={previewUrl} loading={false} />
                          </div>
                        </>
                      ) : (
                        <p className="cdm__empty">
                          {focusLessonId
                            ? "Select the highlighted lesson below to preview the reported video."
                            : "Select a lesson with video to preview."}
                        </p>
                      )}
                    </div>
                  ) : null}
                  {sections.length > 0 ? (
                    <>
                      <p className="cdm__curriculum-summary">
                        {sections.length} section{sections.length !== 1 ? "s" : ""} · {lessonCount} lesson{lessonCount !== 1 ? "s" : ""} · {formatDuration(totalDurationSeconds)} total
                      </p>
                      <div className="cdm__curriculum">
                        {sections.map((section) => (
                          <div key={section.sectionId || section.title} className="cdm__section-block">
                            <button
                              type="button"
                              className="cdm__section-header"
                              onClick={() => toggleSection(section.sectionId || section.title)}
                            >
                              <span className="cdm__section-chevron">
                                {expandedSections[section.sectionId || section.title] ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                              </span>
                              <span className="cdm__section-name">
                                Section {valueOrDash(section.sectionOrder)}: {valueOrDash(section.title)}
                              </span>
                              <span className="cdm__section-count">
                                {section.lessons?.length || 0} lesson{section.lessons?.length === 1 ? "" : "s"}
                              </span>
                            </button>

                            {expandedSections[section.sectionId || section.title] ? (
                              <div className="cdm__lessons">
                                {(section.lessons || []).map((lesson) => {
                                  const isFocused =
                                    focusLessonId != null &&
                                    String(lesson.lessonId) === String(focusLessonId);
                                  const canPlay = enableVideoPreview && Boolean(lesson.videoKey);
                                  return (
                                    <button
                                      key={lesson.lessonId || lesson.title}
                                      type="button"
                                      className={`cdm__lesson${isFocused ? " cdm__lesson--reported" : ""}${canPlay ? " cdm__lesson--playable" : ""}`}
                                      onClick={() => openLessonPreview(lesson)}
                                      disabled={!canPlay}
                                    >
                                      <span className="cdm__lesson-icon">
                                        {lesson.videoKey ? <PlayCircle size={14} /> : <FileText size={14} />}
                                      </span>
                                      <span className="cdm__lesson-title">
                                        {valueOrDash(lesson.lessonOrder)}. {valueOrDash(lesson.title)}
                                        {isFocused ? " · Reported" : ""}
                                      </span>
                                      {lesson.durationSeconds ? (
                                        <span className="cdm__lesson-duration">
                                          <Clock size={11} />
                                          {formatDuration(lesson.durationSeconds)}
                                        </span>
                                      ) : null}
                                      {lesson.isPreview ? <span className="cdm__lesson-preview">Preview</span> : null}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="cdm__empty">No curriculum added yet.</div>
                  )}
                </div>
              ) : null}

              {(Array.isArray(extraTabs) ? extraTabs : []).map((tab) =>
                activeTab === tab.id ? (
                  <div key={tab.id} className="cdm__tab-content">
                    {tab.content}
                  </div>
                ) : null,
              )}

            </>
        </div>

        <div className="cdm__footer">
          <button type="button" className="cdm__btn-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const CourseTable = ({
  courses = [],
  loading,
  error,
  onViewCourse,
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loadingDetailId, setLoadingDetailId] = useState(null);

  const totalPages = Math.max(1, Math.ceil(courses.length / pageSize));
  const currentPageItems = useMemo(
    () => courses.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [courses, currentPage],
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [courses]);

  const closeCourseDetails = () => {
    setSelectedCourse(null);
  };

  const openCourseDetails = async (course) => {
    if (!onViewCourse) {
      setSelectedCourse(course);
      return;
    }

    setLoadingDetailId(course.id);
    try {
      const detailCourse = await onViewCourse(course);
      setSelectedCourse(detailCourse);
    } catch {
      setSelectedCourse(course);
    } finally {
      setLoadingDetailId(null);
    }
  };

  return (
    <section className="courseTableSection" aria-label="Course Management Table">
      <div className="courseTableCard">
        <table className="courseTable" aria-label="Course List">
          <thead>
            <tr>
              <th>{t("courseAdmin.course")}</th><th>{t("courseAdmin.instructor")}</th><th>{t("courseAdmin.category")}</th><th>{t("courseAdmin.level")}</th><th>{t("courseAdmin.priceColumn")}</th><th>{t("courseAdmin.status")}</th><th>{t("courseAdmin.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="courseTableEmpty" colSpan="7">{t("instructorAdmin.loadingDetails")}</td></tr>
            ) : error ? (
              <tr><td className="courseTableEmpty" colSpan="7">{error}</td></tr>
            ) : currentPageItems.length === 0 ? (
              <tr><td className="courseTableEmpty" colSpan="7">{t("courseAdmin.noResults", { defaultValue: "No courses found." })}</td></tr>
            ) : (
              currentPageItems.map((course) => (
                <tr key={course.id}>
                  <td>
                    <div className="courseTableCourseCell">
                      <CourseThumbnail course={course} />
                      <div>
                        <strong>{course.title}</strong>
                        <span>{course.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td>{course.instructorName || "N/A"}</td><td>{course.categoryName || "N/A"}</td><td>{course.level || "N/A"}</td>
                  <td>{formatPrice(course.basePrice)}</td>
                  <td>
                    <span className={`courseStatusBadge courseStatusBadge--${getCourseDisplayStatus(course).toLowerCase()}`}>
                      {getCourseDisplayStatus(course)}
                    </span>
                  </td>
                  <td>
                    <div className="courseTableActions">
                      <button
                        type="button"
                        className="actionButton actionButton--view"
                        aria-label={t("courseAdmin.viewDetails")}
                        title={t("courseAdmin.viewDetails")}
                        disabled={loadingDetailId === course.id}
                        onClick={() => openCourseDetails(course)}
                      >
                        <Info className="actionIcon" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="courseTablePagination">
        <button className="paginationButton" type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}>
          {t("courseAdmin.previous")}
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            type="button"
            className={`paginationButton ${currentPage === i + 1 ? "paginationButton--active" : ""}`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button className="paginationButton" type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}>
          {t("courseAdmin.next")}
        </button>
      </div>

      {selectedCourse ? (
        <CourseViewModal
          course={selectedCourse}
          onClose={closeCourseDetails}
        />
      ) : null}
    </section>
  );
};

const CourseThumbnail = ({ course }) => {
  const thumbnailUrl = useCourseThumbnail(course.thumbnailKey);

  return thumbnailUrl ? (
    <img src={thumbnailUrl} alt={course.title} />
  ) : null;
};

export { CourseViewModal };
export default CourseTable;
