import { BookOpen, CheckCircle, Clock, EyeOff, FileText, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import axiosClient from "../../../../api/AxiosClient.js";

const thumbnailUrlCache = new Map();

const formatCurrency = (value) => {
  const amount = Number(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
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

const formatDuration = (seconds) => {
  const totalSeconds = Number(seconds || 0);
  if (totalSeconds <= 0) return "0m";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const formatPrice = (value) => {
  const price = Number(value || 0);
  if (price === 0) return "Free";
  return formatCurrency(price);
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const ApprovalCourseHero = ({ course, isSubmitting, onApprove, onReject }) => {
  const isPending = course.status === "PENDING_REVIEW";
  const thumbnailUrl = useCourseThumbnail(course.thumbnailKey);

  const metaItems = [
    ["Instructor", course.instructorName],
    ["Category", course.categoryName],
    ["Level", course.level],
    ["Language", course.language],
    ["Price", formatPrice(course.basePrice)],
    ["Published", formatDate(course.publishedAt)],
  ];

  return (
    <section className="approvalCourseCard">
      <div className="approvalCourseCardTop">
        {thumbnailUrl ? (
          <img
            className="approvalCourseThumbnail"
            src={thumbnailUrl}
            alt={course.title}
          />
        ) : null}

        <div className="approvalCourseInfo">
          <div className="approvalCourseInfoTop">
            <span className={`approvalStatusBadge approvalStatusBadge--${course.status.toLowerCase()}`}>
              {course.status}
            </span>

            {isPending ? (
              <div className="approvalActionButtonsGroup">
                <button
                  type="button"
                  className="approvalBtnApproveMain"
                  onClick={onApprove}
                  disabled={isSubmitting}
                >
                  <CheckCircle size={16} />
                  Approve & Publish
                </button>
                <button
                  type="button"
                  className="approvalBtnRejectMain"
                  onClick={onReject}
                  disabled={isSubmitting}
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            ) : (
              <span className="approvalAlreadyPublished">
                {course.status === "ARCHIVED" ? <EyeOff size={15} /> : <CheckCircle size={15} />}
                {course.status === "ARCHIVED" ? "Hidden" : "Reviewed"}
              </span>
            )}
          </div>

          <h2 className="approvalCourseTitle">{course.title}</h2>

          <div className="approvalCourseMeta">
            {metaItems.map(([label, value]) => (
              <span key={label}>
                <strong>{label}:</strong> {value || "-"}
              </span>
            ))}
          </div>

          <div className="approvalCourseStats">
            <span className="approvalCourseStat">
              <BookOpen size={14} />
              {course.sections.length} sections
            </span>
            <span className="approvalCourseStat">
              <FileText size={14} />
              {course.lessonCount} lessons
            </span>
            <span className="approvalCourseStat">
              <Clock size={14} />
              {formatDuration(course.totalDurationSeconds)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ApprovalCourseHero;
