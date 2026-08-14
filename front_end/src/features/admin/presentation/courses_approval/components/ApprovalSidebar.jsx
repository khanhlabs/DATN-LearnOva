import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFileUrl } from "../../../../../shared/api/public/CoursesApi";

const thumbnailUrlCache = new Map();

const useCourseThumbnail = (thumbnailKeyFromDatabase) => {
  const [signedThumbnailUrl, setSignedThumbnailUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const thumbnailKey = thumbnailKeyFromDatabase?.trim();

    const loadThumbnailFromS3 = async () => {
      if (!thumbnailKey) {
        if (isMounted) setSignedThumbnailUrl(null);
        return;
      }

      try {
        let thumbnailUrl = thumbnailUrlCache.get(thumbnailKey);
        if (!thumbnailUrl) {
          thumbnailUrl = await getFileUrl(thumbnailKey);
          if (thumbnailUrl) thumbnailUrlCache.set(thumbnailKey, thumbnailUrl);
        }
        if (isMounted) setSignedThumbnailUrl(thumbnailUrl || null);
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

  if (!thumbnailUrl) {
    return <div className="approvalSidebarThumb approvalSidebarThumb--empty" aria-hidden="true" />;
  }

  return (
    <img
      className="approvalSidebarThumb"
      src={thumbnailUrl}
      alt={course.title}
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
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
