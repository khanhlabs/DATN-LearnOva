import { GraduationCap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { adminNotifySuccess } from "../../../notification/infrastructure/api/NotificationApi";
import {
  approveTeacherApplicationApi,
  getAdminTeacherApplicationDetailApi,
  getAdminTeacherApplicationsApi,
  getCvUrlApi,
  rejectTeacherApplicationApi,
} from "../../infrastructure/api/TeacherApplicationApi";
import "./TeacherApplicationPage";

const TeacherApplicationPage = () => {
  const { t } = useTranslation();
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [selectedId, setSelectedId] = useState(applicationId ? Number(applicationId) : null);
  const [detail, setDetail] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadApplications = async () => {
      try {
        setLoadingList(true);
        const data = await getAdminTeacherApplicationsApi();
        if (!isMounted) return;
        setApplications(Array.isArray(data) ? data : []);
        setSelectedId((currentId) => currentId ?? data?.[0]?.id ?? null);
      } catch (error) {
        if (isMounted) toast.error(error?.response?.data?.message || "Failed to load applications.");
      } finally {
        if (isMounted) setLoadingList(false);
      }
    };

    loadApplications();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadDetail = useCallback(async () => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    try {
      setLoadingDetail(true);
      const data = await getAdminTeacherApplicationDetailApi(selectedId);
      setDetail(data);
    } catch (error) {
      setDetail(null);
      toast.error(error?.response?.data?.message || "Failed to load application detail.");
    } finally {
      setLoadingDetail(false);
    }
  }, [selectedId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (selectedId) {
      navigate(`/learnova/admin/teacher-applications/${selectedId}`, { replace: true });
    }
  }, [navigate, selectedId]);

  const selectApplication = (id) => {
    setSelectedId(id);
    setShowRejectForm(false);
    setRejectReason("");
  };

  const removeFromList = (id) => {
    setApplications((current) => current.filter((app) => app.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  };

  const handleViewCv = async () => {
    if (!selectedId) return;
    try {
      const { url } = await getCvUrlApi(selectedId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to open CV.");
    }
  };

  const handleApprove = async () => {
    if (!selectedId) return;
    try {
      setIsSubmitting(true);
      await approveTeacherApplicationApi(selectedId);
      await adminNotifySuccess("Application approved. The user is now an instructor.", {
        title: "Teacher applications",
      });
      removeFromList(selectedId);
      setDetail(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to approve application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (event) => {
    event.preventDefault();
    if (!selectedId || !rejectReason.trim()) return;
    try {
      setIsSubmitting(true);
      await rejectTeacherApplicationApi(selectedId, rejectReason.trim());
      await adminNotifySuccess("Application rejected. The user has been notified.", {
        title: "Teacher applications",
      });
      removeFromList(selectedId);
      setDetail(null);
      setShowRejectForm(false);
      setRejectReason("");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to reject application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="teacherAppPage">
      <header className="teacherAppPageHeader">
        <h1>{t("teacher_application.title")}</h1>
        <p>{t("teacher_application.subtitle")}</p>
      </header>

      <div className="teacherAppLayout">
        <aside className="teacherAppSidebar">
          {loadingList ? (
            <p className="teacherAppEmptyState">{t("teacher_application.loading")}</p>
          ) : applications.length === 0 ? (
            <p className="teacherAppEmptyState">{t("teacher_application.empty")}</p>
          ) : (
            <ul>
              {applications.map((app) => (
                <li key={app.id}>
                  <button
                    type="button"
                    className={`teacherAppListItem ${selectedId === app.id ? "is-active" : ""}`}
                    onClick={() => selectApplication(app.id)}
                  >
                    <img src={app.userAvatar} alt={app.userFullName} />
                    <div>
                      <strong>{app.userFullName || app.userEmail}</strong>
                      <span>{app.specialization}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="teacherAppMain">
          {!selectedId ? (
            <div className="teacherAppEmptyState teacherAppEmptyStateCenter">
              <GraduationCap size={48} />
              <p>{t("teacher_application.select")}</p>
            </div>
          ) : loadingDetail ? (
            <div className="teacherAppEmptyStateCenter">{t("teacher_application.loadingDetail")}</div>
          ) : !detail ? (
            <div className="teacherAppEmptyStateCenter">Application detail could not be loaded.</div>
          ) : (
            <div className="teacherAppDetail">
              <div className="teacherAppDetailHeader">
                <img src={detail.userAvatar} alt={detail.userFullName} />
                <div>
                  <h2>{detail.userFullName || detail.userEmail}</h2>
                  <p>{detail.userEmail}</p>
                </div>
              </div>

              <div className="teacherAppDetailField">
                <label>Specialization</label>
                <p>{detail.specialization}</p>
              </div>

              <div className="teacherAppDetailField">
                <label>Experience</label>
                <p className="teacherAppMultiline">{detail.experience}</p>
              </div>

              <div className="teacherAppDetailField">
                <label>CV</label>
                <button type="button" className="teacherAppViewCvBtn" onClick={handleViewCv}>
                  View CV (PDF)
                </button>
              </div>

              {!showRejectForm ? (
                <div className="teacherAppActions">
                  <button type="button" className="teacherAppApproveBtn" disabled={isSubmitting} onClick={handleApprove}>
                    Approve
                  </button>
                  <button
                    type="button"
                    className="teacherAppRejectBtn"
                    disabled={isSubmitting}
                    onClick={() => setShowRejectForm(true)}
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <form className="teacherAppRejectForm" onSubmit={handleReject}>
                  <label>
                    Rejection reason
                    <textarea
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      required
                    />
                  </label>
                  <div className="teacherAppActions">
                    <button type="submit" className="teacherAppRejectBtn" disabled={isSubmitting}>
                      Confirm Reject
                    </button>
                    <button type="button" onClick={() => setShowRejectForm(false)} disabled={isSubmitting}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TeacherApplicationPage;
