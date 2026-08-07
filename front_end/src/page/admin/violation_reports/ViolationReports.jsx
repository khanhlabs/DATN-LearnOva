import { Ban, Eye, Flag, LockKeyhole, Megaphone, ShieldAlert, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { getAdminCourseDetailApi } from "../../../api/admin/CourseApi.js";
import { useAxiosPrivate } from "../../../hook/useAxiosPrivate.js";
import { CourseViewModal } from "../course/courses_table/CourseTable.jsx";
import "../course/courses_table/CourseTable.css";
import "../shared/AdminDataPage.css";
import AdminHoverSelect from "../shared/AdminHoverSelect";
import ModerationActionModal from "./modal/ModerationActionModal.jsx";
import "./ViolationReports.css";

const ALL_STATUSES = "All statuses";
const ALL_COUNTS = "Report count";

const REASON_LABELS = {
  VIDEO_ERROR: "Video error / cannot play",
  AUDIO_ERROR: "Audio error",
  BROKEN_DOCUMENT: "Broken document / resource",
  OUTDATED_CONTENT: "Outdated content",
  INCORRECT_CONTENT: "Incorrect content",
  OTHER_COURSE_ISSUE: "Other course issue",
  MISLEADING_CONTENT: "Misleading content",
  SENSITIVE_CONTENT: "Sensitive / inappropriate content",
  SPAM: "Spam / advertising",
  FRAUD: "Fraud / scam",
  COPYRIGHT: "Copyright violation",
  HARASSMENT: "Harassment / abuse",
  PROHIBITED_CONTENT: "Prohibited content",
  INSTRUCTOR_BEHAVIOR: "Instructor behavior",
  OTHER_VIOLATION: "Other policy violation",
  OTHER: "Other",
};

const POLICY_REASONS = new Set([
  "SPAM",
  "FRAUD",
  "COPYRIGHT",
  "SENSITIVE_CONTENT",
  "HARASSMENT",
  "PROHIBITED_CONTENT",
  "INSTRUCTOR_BEHAVIOR",
  "OTHER_VIOLATION",
]);

const categoryLabel = (reason) =>
  POLICY_REASONS.has(reason) ? "Policy violation" : "Course issue";

const formatStatus = (status) => {
  const map = {
    PENDING: "Pending",
    REVIEWING: "Reviewing",
    RESOLVED: "Resolved",
    DISMISSED: "Dismissed",
  };
  if (!status) return "Pending";
  return map[status] || status.charAt(0) + status.slice(1).toLowerCase();
};

const apiErrorMessage = (err, fallback) =>
  err?.response?.data?.message || err?.response?.data?.error || fallback;

const normalizeReportText = (value) => {
  if (value == null) return "";
  const text = String(value).trim();
  if (!text || text === "null" || text === "undefined") return "";
  return text;
};

const normalizeCourseDetail = (course = {}) => ({
  ...course,
  id: course.id,
  thumbnailKey: course.thumbnailKey ?? "",
  title: course.title ?? "N/A",
  slug: course.slug ?? "",
  description: course.description ?? "",
  language: course.language ?? "N/A",
  requirements: Array.isArray(course.requirements) ? course.requirements : [],
  whatYouLearn: Array.isArray(course.whatYouLearn) ? course.whatYouLearn : [],
  basePrice: course.basePrice ?? 0,
  level: course.level ?? "N/A",
  status: course.status ?? "N/A",
  instructorId: course.instructorId ?? null,
  instructorName: course.instructorName ?? "N/A",
  categoryId: course.categoryId ?? null,
  categoryName: course.categoryName ?? null,
  publishedAt: course.publishedAt ?? null,
  lessonCount: course.lessonCount ?? 0,
  totalDurationSeconds: course.totalDurationSeconds ?? 0,
  sections: Array.isArray(course.sections) ? course.sections : [],
});

const ViolationReports = () => {
  const { t } = useTranslation();
  const axiosPrivate = useAxiosPrivate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    openReports: 0,
    reportedCourses: 0,
    hiddenByModeration: 0,
    resolvedCases: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(ALL_STATUSES);
  const [selectedCount, setSelectedCount] = useState(ALL_COUNTS);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewCourse, setViewCourse] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { kind: 'warn'|'hide', report }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        axiosPrivate.get("/admin/reports"),
        axiosPrivate.get("/admin/reports/stats"),
      ]);
      setReports(Array.isArray(listRes.data) ? listRes.data : []);
      setStats(
        statsRes.data || {
          openReports: 0,
          reportedCourses: 0,
          hiddenByModeration: 0,
          resolvedCases: 0,
        },
      );
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to load reports."));
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [axiosPrivate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const closeCourseView = () => {
    setSelectedReport(null);
    setViewCourse(null);
    setViewLoading(false);
  };

  const openReportView = useCallback(
    async (row) => {
      if (!row?.courseId) {
        toast.error("This report is missing a course id.");
        return;
      }
      setSelectedReport(row);
      setViewCourse(null);
      setViewLoading(true);
      try {
        const detail = await getAdminCourseDetailApi(row.courseId, axiosPrivate);
        setViewCourse(normalizeCourseDetail(detail));
      } catch (err) {
        toast.error(apiErrorMessage(err, "Failed to load course details."));
        setSelectedReport(null);
      } finally {
        setViewLoading(false);
      }
    },
    [axiosPrivate],
  );

  useEffect(() => {
    const focusId = searchParams.get("id");
    if (!focusId || reports.length === 0) return;
    const found = reports.find(
      (r) =>
        String(r.id) === String(focusId) ||
        String(r.reportKey) === String(focusId) ||
        String(r.reportCode) === String(focusId),
    );
    if (found) {
      void openReportView(found);
      searchParams.delete("id");
      setSearchParams(searchParams, { replace: true });
    }
  }, [reports, searchParams, setSearchParams, openReportView]);

  useEffect(() => {
    if (!selectedReport?.id || reports.length === 0) return;
    const fresh = reports.find((r) => r.id === selectedReport.id);
    if (fresh) setSelectedReport(fresh);
  }, [reports, selectedReport?.id]);

  const statusOptions = useMemo(
    () => [ALL_STATUSES, ...new Set(reports.map((row) => formatStatus(row.status)))],
    [reports],
  );

  const countOptions = useMemo(() => {
    const counts = [...new Set(reports.map((row) => Number(row.reportCount) || 0))]
      .filter((n) => n > 0)
      .sort((a, b) => b - a);
    return [ALL_COUNTS, ...counts.map((n) => String(n))];
  }, [reports]);

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = reports.filter((row) => {
      const statusLabel = formatStatus(row.status);
      const matchesStatus =
        selectedStatus === ALL_STATUSES || statusLabel === selectedStatus;
      const matchesCount =
        selectedCount === ALL_COUNTS || String(row.reportCount) === selectedCount;
      const haystack = [
        row.reportCode,
        row.courseTitle,
        row.lessonTitle,
        row.reporterName,
        row.reason,
        REASON_LABELS[row.reason],
        row.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      return matchesStatus && matchesCount && matchesSearch;
    });

    if (selectedCount !== ALL_COUNTS) {
      rows = [...rows].sort((a, b) => (b.reportCount || 0) - (a.reportCount || 0));
    }
    return rows;
  }, [reports, search, selectedStatus, selectedCount]);

  const statCards = [
    { label: t("opsAdmin.open"), value: stats.openReports, note: t("opsAdmin.awaiting"), icon: Flag },
    {
      label: t("opsAdmin.reported"),
      value: stats.reportedCourses,
      note: t("opsAdmin.openReports"),
      icon: TriangleAlert,
    },
    {
      label: t("opsAdmin.hiddenModeration"),
      value: stats.hiddenByModeration,
      note: t("opsAdmin.hiddenCourses"),
      icon: ShieldAlert,
    },
    { label: t("opsAdmin.resolved"), value: stats.resolvedCases, note: t("opsAdmin.closed"), icon: Ban },
  ];

  const openWarnModal = (row) => setActionModal({ kind: "warn", report: row });
  const openHideModal = (row) => {
    if (row.courseHidden) {
      toast.info("This course is already hidden.");
      return;
    }
    if (!row.instructorWarned) {
      toast.info("Notify the instructor first. Hide the course only if they do not fix it.");
      return;
    }
    setActionModal({ kind: "hide", report: row });
  };

  const closeActionModal = () => {
    if (actionLoadingId) return;
    setActionModal(null);
  };

  const submitHide = async (row) => {
    setActionLoadingId(row.id);
    try {
      await axiosPrivate.patch(`/admin/reports/${row.id}/hide-course`);
      toast.success("Course hidden. The instructor has been notified.");
      setActionModal(null);
      closeCourseView();
      await loadData();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to hide course."));
    } finally {
      setActionLoadingId(null);
    }
  };

  const submitWarn = async (row, message) => {
    setActionLoadingId(row.id);
    try {
      await axiosPrivate.patch(`/admin/reports/${row.id}/warn-instructor`, {
        message: message || null,
      });
      toast.success("Instructor notified to fix the reported content.");
      setActionModal(null);
      await loadData();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to notify instructor."));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleActionConfirm = async (message) => {
    if (!actionModal?.report) return;
    if (actionModal.kind === "warn") {
      await submitWarn(actionModal.report, message);
      return;
    }
    await submitHide(actionModal.report);
  };

  const reportDescription = normalizeReportText(selectedReport?.description);
  const reportReason = REASON_LABELS[selectedReport?.reason] || selectedReport?.reason || "—";
  const instructorWarned = Boolean(selectedReport?.instructorWarned);
  const canHideCourse = instructorWarned && !selectedReport?.courseHidden;
  const moderationHint = selectedReport?.courseHidden
    ? "This course is already hidden from students."
    : instructorWarned
      ? "Instructor was reminded. If they still do not fix the content, you can hide the course."
      : 'Step 1: notify the instructor. Hide course is only available after they have been reminded and still do not fix it.';

  const reportTabContent = selectedReport ? (
    <div className="violation-report-tab">
      <div className="violation-report-panel">
        <div className="violation-report-panel__info">
          <strong>{selectedReport.reportCode || `RPT-${selectedReport.id}`}</strong>
          <span>
            Type: {categoryLabel(selectedReport.reason)} · Reason: {reportReason}
            {selectedReport.severity === "HIGH" ? " · High severity" : ""}
          </span>
          {selectedReport.reporterName ? (
            <span>Reporter: {selectedReport.reporterName}</span>
          ) : null}
          <span className="violation-report-panel__description">
            Note: {reportDescription || "No additional description."}
          </span>
          {selectedReport.lessonTitle ? (
            <span>Reported lesson: {selectedReport.lessonTitle}</span>
          ) : null}
          <span>
            Status: {formatStatus(selectedReport.status)}
            {instructorWarned ? " · Instructor reminded" : ""}
            {selectedReport.courseHidden ? " · Course hidden" : ""}
          </span>
          <span className="violation-report-panel__hint">{moderationHint}</span>
        </div>
      </div>

      <ol className="violation-report-steps">
        <li className={instructorWarned ? "done" : "current"}>
          Remind the instructor to fix the reported content.
        </li>
        <li className={selectedReport.courseHidden ? "done" : instructorWarned ? "current" : ""}>
          If they do not fix it, hide the course from students.
        </li>
      </ol>

      <div className="violation-report-panel__actions">
        <button
          type="button"
          className="violation-report-btn"
          onClick={() => openWarnModal(selectedReport)}
          disabled={
            actionLoadingId === selectedReport.id ||
            selectedReport.courseHidden ||
            ["RESOLVED", "DISMISSED"].includes(selectedReport.status)
          }
        >
          {instructorWarned ? "Remind instructor again" : "Notify instructor"}
        </button>
        <button
          type="button"
          className="violation-report-btn danger"
          onClick={() => openHideModal(selectedReport)}
          disabled={actionLoadingId === selectedReport.id || !canHideCourse}
          title={
            selectedReport.courseHidden
              ? "Course already hidden"
              : instructorWarned
                ? "Hide course because instructor did not fix it"
                : "Notify the instructor first"
          }
        >
          Hide course
        </button>
      </div>
    </div>
  ) : null;

  const reportExtraTabs = selectedReport
    ? [
        {
          id: "report",
          label: "Report",
          Icon: Flag,
          content: reportTabContent,
        },
      ]
    : [];

  return (
    <section className="adminDataPage" aria-label="Violation reports">
      <div className="adminDataContent">
        <div className="adminDataStats">
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <article className="adminDataStatCard" key={item.label}>
                <span className="adminDataStatIcon">
                  <Icon size={22} />
                </span>
                <div>
                  <strong>{loading ? "…" : item.value}</strong>
                  <p>{item.label}</p>
                  <small>{item.note}</small>
                </div>
              </article>
            );
          })}
        </div>

        <div className="adminDataFilters">
          <input
            type="search"
            placeholder={t("opsAdmin.searchReport")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <AdminHoverSelect
            options={statusOptions}
            value={selectedStatus}
            onChange={setSelectedStatus}
            ariaLabel="Filter by status"
          />
          <AdminHoverSelect
            options={countOptions}
            value={selectedCount}
            onChange={setSelectedCount}
            ariaLabel="Filter by report count"
          />
        </div>

        <div className="adminDataTableCard">
          <table className="adminDataTable violationReportsTable">
            <thead>
              <tr>
                <th>Report code</th>
                <th>Target</th>
                <th>Count</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5}>Loading reports…</td>
                </tr>
              )}
              {!loading && filteredReports.length === 0 && (
                <tr>
                  <td colSpan={5}>{t("opsAdmin.noReports")}</td>
                </tr>
              )}
              {!loading &&
                filteredReports.map((row) => {
                  const statusLabel = formatStatus(row.status);
                  const target = row.lessonTitle
                    ? `${row.courseTitle} · ${row.lessonTitle}`
                    : row.courseTitle;
                  return (
                    <tr key={row.id}>
                      <td>{row.reportCode || `RPT-${row.id}`}</td>
                      <td>
                        <div className="violation-report-target">
                          <span>{target}</span>
                          <small>{categoryLabel(row.reason)}</small>
                          <small>{REASON_LABELS[row.reason] || row.reason}</small>
                          {row.severity === "HIGH" ? (
                            <small className="violation-report-severity">High severity</small>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span className="adminDataStatus adminDataStatus--warning">{row.reportCount}</span>
                      </td>
                      <td>
                        <span className={`adminDataStatus adminDataStatus--${String(row.status || "pending").toLowerCase()}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td>
                        <div className="adminDataActions">
                          <button
                            type="button"
                            className="adminDataIconButton"
                            aria-label={`View ${row.reportCode}`}
                            title="View course and reported video"
                            onClick={() => openReportView(row)}
                            disabled={actionLoadingId === row.id || viewLoading}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="adminDataIconButton"
                            aria-label={`Notify instructor ${row.reportCode}`}
                            title="Notify instructor to fix the video"
                            onClick={() => openWarnModal(row)}
                            disabled={actionLoadingId === row.id}
                          >
                            <Megaphone size={16} />
                          </button>
                          <button
                            type="button"
                            className="adminDataIconButton"
                            aria-label={`Hide course ${row.reportCode}`}
                            title={
                              row.courseHidden
                                ? "Course already hidden"
                                : row.instructorWarned
                                  ? "Hide course from students"
                                  : "Notify instructor first"
                            }
                            onClick={() => openHideModal(row)}
                            disabled={
                              actionLoadingId === row.id ||
                              row.courseHidden ||
                              !row.instructorWarned
                            }
                          >
                            <LockKeyhole size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {viewLoading && (
        <div className="violation-report-loading-overlay" role="status">
          Loading course details…
        </div>
      )}

      {viewCourse && selectedReport && (
        <CourseViewModal
          course={viewCourse}
          onClose={closeCourseView}
          focusLessonId={selectedReport.lessonId}
          enableVideoPreview
          initialTab="report"
          extraTabs={reportExtraTabs}
        />
      )}

      {actionModal ? (
        <ModerationActionModal
          kind={actionModal.kind}
          report={actionModal.report}
          isSubmitting={actionLoadingId === actionModal.report?.id}
          onCancel={closeActionModal}
          onConfirm={handleActionConfirm}
        />
      ) : null}
    </section>
  );
};

export default ViolationReports;
