import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axiosClient from "../../../../api/AxiosClient.js";

const thumbnailUrlCache = new Map();

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

const ApprovalSidebarThumbnail = ({ course }) => {
  const thumbnailUrl = useCourseThumbnail(course.thumbnailKey);

  return thumbnailUrl ? (
    <img className="approvalSidebarThumb" src={thumbnailUrl} alt={course.title} />
  ) : null;
};

const ApprovalSidebar = ({ courses, selectedId, onSelect }) => {
  const { t } = useTranslation();
  return <aside className="approvalSidebar">
    <div className="approvalSidebarHeader">
      <p className="approvalSidebarEyebrow">{t("courseApproval.pending")}</p>
      <p className="approvalSidebarCount">{t("courseApproval.count", { count: courses.length })}</p>
    </div>

    <ul className="approvalSidebarList">
      {courses.length === 0 ? (
        <li className="approvalSidebarEmpty">{t("courseApproval.empty")}</li>
      ) : (
        courses.map((course) => (
          <li key={course.id}>
            <button
              type="button"
              className={`approvalSidebarItem ${
                selectedId === course.id ? "approvalSidebarItem--active" : ""
              }`}
              onClick={() => onSelect(course.id)}
            >
              <ApprovalSidebarThumbnail course={course} />

              <div className="approvalSidebarItemInfo">
                <span className="approvalSidebarItemTitle">{course.title}</span>
                <span className="approvalSidebarItemInstructor">{course.instructorName}</span>
              </div>
            </button>
          </li>
        ))
      )}
    </ul>
  </aside>;
};

export default ApprovalSidebar;
