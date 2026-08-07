import { ArrowLeft, BookOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { adminNotifySuccess } from "../../../api/noti/NotificationApi.js";
import {
  approveAdminCourseApi,
  getAdminCourseDetailApi,
  getAdminCoursesApi,
  hideAdminCourseApi,
  rejectAdminCourseApi,
} from "../../../api/admin/CourseApi.js";
import { useAxiosPrivate } from "../../../hook/useAxiosPrivate.js";
import ApprovalConfirmModal from "./components/ApprovalConfirmModal.jsx";
import ApprovalCourseDetail from "./components/ApprovalCourseDetail.jsx";
import ApprovalSidebar from "./components/ApprovalSidebar.jsx";
import "./CourseApprovalPage.css";

const toArray = (value) => (Array.isArray(value) ? value : []);

const mapCourseSummaryFromDb = (course = {}) => ({
  id: course.id ?? null,
  title: course.title ?? "Untitled course",
  thumbnailKey: course.thumbnailKey ?? "",
  status: course.status ?? "N/A",
  instructorName: course.instructorName ?? "-",
});

const mapCourseDetailFromDb = (course = {}) => ({
  ...course,
  id: course.id ?? null,
  title: course.title ?? "Untitled course",
  description: course.description ?? "",
  thumbnailKey: course.thumbnailKey ?? "",
  basePrice: course.basePrice ?? 0,
  level: course.level ?? "-",
  language: course.language ?? "-",
  status: course.status ?? "N/A",
  instructorName: course.instructorName ?? "-",
  categoryName: course.categoryName ?? "-",
  requirements: toArray(course.requirements),
  whatYouLearn: toArray(course.whatYouLearn),
  lessonCount: course.lessonCount ?? 0,
  totalDurationSeconds: course.totalDurationSeconds ?? 0,
  sections: toArray(course.sections).map((section) => ({
    ...section,
    sectionId: section.sectionId ?? section.id,
    title: section.title ?? "Untitled section",
    lessons: toArray(section.lessons).map((lesson) => ({
      ...lesson,
      lessonId: lesson.lessonId ?? lesson.id,
      title: lesson.title ?? "Untitled lesson",
      durationSeconds: lesson.durationSeconds ?? 0,
      videoKey: lesson.videoKey ?? "",
      isPreview: Boolean(lesson.isPreview),
    })),
  })),
});

const mapCourseListFromDb = (courses) => toArray(courses).map(mapCourseSummaryFromDb);

const useCourseApproval = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const axiosClient = useAxiosPrivate();

  const [courses, setCourses] = useState([]);
  const [selectedId, setSelectedId] = useState(courseId ? Number(courseId) : null);
  const [detail, setDetail] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const draftCourses = useMemo(
    () => courses.filter((course) => course.status === "PENDING_REVIEW"),
    [courses],
  );

  useEffect(() => {
    let isMounted = true;

    const loadCoursesFromDb = async () => {
      try {
        setLoadingList(true);
        const data = await getAdminCoursesApi(axiosClient);
        const mappedCourses = mapCourseListFromDb(data);

        if (!isMounted) return;

        setCourses(mappedCourses);
        setSelectedId((currentId) => {
          if (currentId) return currentId;
          return mappedCourses.find((course) => course.status === "PENDING_REVIEW")?.id ?? null;
        });
      } catch (error) {
        if (isMounted) toast.error(error?.response?.data?.message || "Failed to load courses.");
      } finally {
        if (isMounted) setLoadingList(false);
      }
    };

    loadCoursesFromDb();

    return () => {
      isMounted = false;
    };
  }, [axiosClient]);

  const loadSelectedCourseDetailFromDb = useCallback(async () => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    try {
      setLoadingDetail(true);
      const data = await getAdminCourseDetailApi(selectedId, axiosClient);
      setDetail(mapCourseDetailFromDb(data));
    } catch (error) {
      setDetail(null);
      toast.error(error?.response?.data?.message || "Failed to load course detail.");
    } finally {
      setLoadingDetail(false);
    }
  }, [axiosClient, selectedId]);

  useEffect(() => {
    loadSelectedCourseDetailFromDb();
  }, [loadSelectedCourseDetailFromDb]);

  useEffect(() => {
    if (selectedId) {
      navigate(`/learnova/admin/course-approval/${selectedId}`, { replace: true });
    }
  }, [navigate, selectedId]);

  const selectCourse = (id) => {
    setSelectedId(id);
    setActiveAction(null);
  };

  const updateCourseStatusInList = (id, status) => {
    setCourses((currentCourses) =>
      currentCourses.map((course) => (course.id === id ? { ...course, status } : course)),
    );
  };

  const submitActiveAction = async (reason) => {
    if (!selectedId || !activeAction) return;

    const actionRequest =
      activeAction === "hide"
        ? (id, client) => hideAdminCourseApi(id, client)
        : activeAction === "reject"
          ? (id, client) => rejectAdminCourseApi(id, reason, client)
          : (id, client) => approveAdminCourseApi(id, client);
    const successMessage =
      activeAction === "hide"
        ? "Course hidden successfully."
        : activeAction === "reject"
          ? "Course rejected. The instructor has been notified."
          : "Course approved and published successfully.";

    try {
      setIsSubmitting(true);
      const updatedCourse = await actionRequest(selectedId, axiosClient);
      const mappedDetail = mapCourseDetailFromDb(updatedCourse);

      setDetail(mappedDetail);
      updateCourseStatusInList(selectedId, mappedDetail.status);
      await adminNotifySuccess(successMessage, { title: "Course approval" });
      setActiveAction(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Course action failed. Please try again.");
      setActiveAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    draftCourses,
    selectedId,
    detail,
    loadingList,
    loadingDetail,
    activeAction,
    isSubmitting,
    selectCourse,
    openAction: setActiveAction,
    closeAction: () => setActiveAction(null),
    submitActiveAction,
  };
};

const CourseApprovalPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    draftCourses,
    selectedId,
    detail,
    loadingList,
    loadingDetail,
    activeAction,
    isSubmitting,
    selectCourse,
    openAction,
    closeAction,
    submitActiveAction,
  } = useCourseApproval();

  return (
    <div className="approvalPage">
      <header className="approvalPageHeader">
        <button
          type="button"
          className="approvalBackBtn"
          onClick={() => navigate("/learnova/admin/courses")}
        >
          <ArrowLeft size={16} />
          {t("courses_approval.back")}
        </button>

        <div className="approvalPageHeaderTitle">
          <h1>{t("courses_approval.title")}</h1>
          <p>{t("courses_approval.subtitle")}</p>
        </div>
      </header>

      <div className="approvalLayout">
        {loadingList ? (
          <aside className="approvalSidebar approvalSidebarLoading">{t("courses_approval.loading")}</aside>
        ) : (
          <ApprovalSidebar
            courses={draftCourses}
            selectedId={selectedId}
            onSelect={selectCourse}
          />
        )}

        <main className="approvalMain">
          {!selectedId ? (
            <div className="approvalEmptyState">
              <BookOpen size={48} />
              <p>{t("courses_approval.select")}</p>
            </div>
          ) : loadingDetail ? (
            <div className="approvalEmptyState">{t("courses_approval.loadingDetail")}</div>
          ) : !detail ? (
            <div className="approvalEmptyState approvalEmptyState--error">
              {t("courses_approval.error")}
            </div>
          ) : (
            <ApprovalCourseDetail
              course={detail}
              isSubmitting={isSubmitting}
              onApprove={() => openAction("approve")}
              onReject={() => openAction("reject")}
            />
          )}
        </main>
      </div>

      {activeAction && detail && (
        <ApprovalConfirmModal
          action={activeAction}
          courseTitle={detail.title}
          isSubmitting={isSubmitting}
          onConfirm={submitActiveAction}
          onCancel={closeAction}
        />
      )}
    </div>
  );
};

export default CourseApprovalPage;
