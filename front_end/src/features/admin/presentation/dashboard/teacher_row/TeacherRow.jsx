import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFileUrl } from "../../../../../shared/api/public/CoursesApi";
import "./TeacherRow.css";

const getInitials = (name) =>
  String(name || "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const isResolvedImageUrl = (value) => /^(https?:)?\/\//i.test(value) || /^(data|blob):/i.test(value);

const TeacherAvatar = ({ instructor, getAvatarValue }) => {
  const [failedAvatar, setFailedAvatar] = useState("");
  const [signedAvatar, setSignedAvatar] = useState({ key: "", url: "" });
  const avatar = getAvatarValue(instructor);
  const resolvedAvatar = isResolvedImageUrl(avatar)
    ? avatar
    : signedAvatar.key === avatar
      ? signedAvatar.url
      : "";
  const shouldShowImage = Boolean(resolvedAvatar) && failedAvatar !== resolvedAvatar;

  useEffect(() => {
    let isMounted = true;

    if (!avatar || isResolvedImageUrl(avatar)) {
      return () => {
        isMounted = false;
      };
    }

    // Fetch a signed URL when the avatar value is an S3 storage key.
    getFileUrl(avatar)
      .then((url) => {
        if (isMounted) setSignedAvatar({ key: avatar, url: url || "" });
      })
      .catch(() => {
        if (isMounted) setSignedAvatar({ key: avatar, url: "" });
      });

    return () => {
      isMounted = false;
    };
  }, [avatar]);

  if (shouldShowImage) {
    return (
      <img
        className="teacherRowAvatar"
        src={resolvedAvatar}
        alt={instructor.name}
        loading="lazy"
        onError={() => setFailedAvatar(resolvedAvatar)}
      />
    );
  }

  return (
    <div className="teacherRowAvatar teacherRowAvatar--placeholder">
      {getInitials(instructor.name)}
    </div>
  );
};

const TeacherRow = ({ instructors = [], getAvatarValue = () => "" }) => {
  const { t } = useTranslation();
  return (
    <section className="teacherRowSection" aria-label="Featured Instructors">
      <div className="teacherRowCard">
        <div className="teacherRowCardHeader">
          <div>
            <h3 className="teacherRowCardTitle">{t("admin.featuredInstructors")}</h3>
          </div>
        </div>

        <div className="teacherRowList">
          {instructors.length === 0 && <p className="teacherRowEmpty">{t("admin.noInstructors")}</p>}
          {instructors.map((instructor) => (
            <article key={instructor.id} className="teacherRowItem">
              <div className="teacherRowAvatarWrap">
                <TeacherAvatar
                  instructor={instructor}
                  getAvatarValue={getAvatarValue}
                />
                <span className="teacherRowRank">{instructor.rank}</span>
              </div>

              <div className="teacherRowContent">
                <p className="teacherRowName">{instructor.name}</p>
                <p className="teacherRowCourseCount">
                  {t("admin.coursesCount", { count: instructor.courses })}
                </p>
              </div>

              <div className="teacherRowRating">
                <Star
                  className="teacherRowStar"
                  size={10}
                  fill="currentColor"
                />
                <span className="teacherRowRatingValue">{instructor.rating}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeacherRow;
