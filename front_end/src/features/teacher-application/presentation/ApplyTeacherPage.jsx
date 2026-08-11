import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  getMyCvUrlApi,
  getMyTeacherApplicationsApi,
  submitTeacherApplicationApi,
} from "../../profile/infrastructure/api/TeacherApply.js";
import { generateUploadUrl } from "../../instructor/infrastructure/api/teacher/UploadApi.js";
import { uploadFileWithProgress } from "../../../shared/services/UploadService";
import "./ApplyTeacherPage.css";

const STATUS_LABEL = {
  PENDING: "Đang chờ duyệt",
  APPROVED: "Đã được duyệt",
  REJECTED: "Đã bị từ chối",
};

const MAX_CV_SIZE = 5 * 1024 * 1024; // 5 MB

const validateCv = (file) => {
  if (file.type !== "application/pdf") return "CV phải là file PDF.";
  if (file.size > MAX_CV_SIZE) return "File CV phải nhỏ hơn 5 MB.";
  return null;
};

const ApplyTeacherPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cvFile, setCvFile] = useState(null);
  const [form, setForm] = useState({ specialization: "", experience: "" });
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadApplications = async () => {
      try {
        setLoading(true);
        const data = await getMyTeacherApplicationsApi();
        if (isMounted) setApplications(Array.isArray(data) ? data : []);
      } catch (error) {
        if (isMounted) {
          toast.error(error?.response?.data?.message || "Không thể tải đơn đăng ký.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadApplications();
    return () => {
      isMounted = false;
    };
  }, []);

  const pendingApplication = applications.find((app) => app.status === "PENDING");

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const validationError = validateCv(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setCvFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.specialization.trim() || !form.experience.trim()) {
      toast.error("Vui lòng điền đầy đủ chuyên môn và kinh nghiệm.");
      return;
    }
    if (!cvFile) {
      toast.error("Vui lòng đính kèm CV (file PDF).");
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadProgress(0);

      const { uploadUrl, fileKey } = await generateUploadUrl({
        type: "CV",
        fileName: cvFile.name,
        contentType: cvFile.type,
      });
      await uploadFileWithProgress(uploadUrl, cvFile, setUploadProgress);

      const newApplication = await submitTeacherApplicationApi({
        ...form,
        cvKey: fileKey,
      });

      setApplications((current) => [newApplication, ...current]);
      setForm({ specialization: "", experience: "" });
      setCvFile(null);
      toast.success("Đơn đăng ký đã được gửi. Vui lòng chờ admin duyệt.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Gửi đơn thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleViewCv = async (applicationId) => {
    try {
      const { url } = await getMyCvUrlApi(applicationId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể mở CV.");
    }
  };

  return (
    <div className="applyTeacherPage">
      <div className="applyTeacherCard">
        <h1>Đăng ký trở thành giảng viên</h1>
        <p className="applyTeacherSubtitle">
          Chia sẻ kiến thức của bạn với hàng ngàn học viên trên LearnOva.
        </p>

        {loading ? (
          <p>Đang tải...</p>
        ) : pendingApplication ? (
          <div className="applyTeacherPendingNotice">
            Bạn đã có một đơn đang <b>{STATUS_LABEL.PENDING.toLowerCase()}</b>. Vui lòng chờ admin xem xét.
          </div>
        ) : (
          <form className="applyTeacherForm" onSubmit={handleSubmit}>
            <label>
              Chuyên môn / lĩnh vực giảng dạy
              <input
                type="text"
                value={form.specialization}
                onChange={handleChange("specialization")}
                placeholder="Vd: Lập trình Web, Thiết kế đồ họa..."
                required
              />
            </label>

            <label>
              Kinh nghiệm giảng dạy / chuyên môn
              <textarea
                rows={5}
                value={form.experience}
                onChange={handleChange("experience")}
                placeholder="Mô tả kinh nghiệm, quá trình học tập/làm việc liên quan..."
                required
              />
            </label>

            <label>
              CV (file PDF, bắt buộc)
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                required={!cvFile}
              />
            </label>

            {cvFile && <p className="applyTeacherCvSelected">Đã chọn: {cvFile.name}</p>}

            {isSubmitting && uploadProgress > 0 && (
              <div className="applyTeacherUploadProgress">
                <div className="applyTeacherUploadProgressFill" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi..." : "Gửi đơn đăng ký"}
            </button>
          </form>
        )}

        {applications.length > 0 && (
          <div className="applyTeacherHistory">
            <h2>Lịch sử đơn đăng ký</h2>
            <ul>
              {applications.map((app) => (
                <li key={app.id} className={`applyTeacherHistoryItem status-${app.status.toLowerCase()}`}>
                  <div>
                    <strong>{app.specialization}</strong>
                    <span className="applyTeacherStatusBadge">
                      {STATUS_LABEL[app.status] || app.status}
                    </span>
                  </div>
                  <button type="button" className="applyTeacherViewCvBtn" onClick={() => handleViewCv(app.id)}>
                    Xem CV
                  </button>
                  {app.status === "REJECTED" && app.rejectionReason && (
                    <p className="applyTeacherRejectionReason">Lý do: {app.rejectionReason}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyTeacherPage;
