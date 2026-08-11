import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";
import { getAdminInstructorByIdApi } from "../../../infrastructure/api/InstructorApi";
import { getFileUrl } from "../../../../../shared/api/public/CoursesApi";
import { useAxiosPrivate } from "../../../../../shared/hooks/useAxiosPrivate";
import ViewTeacherModal from "../modal/ViewTeacherModal";
import "./TeacherTable.css";

const API_URL = import.meta.env.VITE_API_URL || "";
const API_ORIGIN = API_URL.replace(/\/api\/learnova\/?$/, "");

const formatNumber = (value) =>
  new Intl.NumberFormat("vi-VN").format(value == null ? 0 : Number(value) || 0);

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(String(value || ""));

const fallbackMediaUrl = (value) => {
  if (!value || isAbsoluteUrl(value) || !API_ORIGIN) return value;
  return `${API_ORIGIN}/${String(value).replace(/^\/+/, "")}`;
};

const resolveMediaUrl = async (value) => {
  if (!value || isAbsoluteUrl(value)) return value;
  try {
    return await getFileUrl(value);
  } catch {
    return fallbackMediaUrl(value);
  }
};

const mapInstructorForDisplay = (instructor) => ({
  ...instructor,
  displayId: instructor.instructorCode || "N/A",
  displayName: instructor.fullName || "Unknown",
  displaySpecialization: instructor.specialization || "N/A",
  displayStudents: formatNumber(instructor.totalStudents ?? 0),
  displayClasses: instructor.numberOfClasses ?? 0,
});

const TeacherTable = ({
  instructors = [],
  searchTerm = "",
  isLoading = false,
  error = "",
}) => {
  const { t } = useTranslation();
  const axiosPrivate = useAxiosPrivate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");
  const pageSize = 10;

  const instructorsData = useMemo(
    () => instructors.map(mapInstructorForDisplay),
    [instructors],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredInstructors = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return instructorsData.filter((instructor) => {
      const matchesSearch =
        !keyword ||
        [
          instructor.fullName,
          instructor.email,
          instructor.instructorCode,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      return matchesSearch;
    });
  }, [instructorsData, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredInstructors.length / pageSize));
  const currentItems = filteredInstructors.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleView = async (instructor) => {
    setSelectedInstructor(instructor);
    setViewError("");
    setIsViewLoading(true);

    try {
      const detail = await getAdminInstructorByIdApi(instructor.instructorId, axiosPrivate);
      const mappedDetail = mapInstructorForDisplay(detail);

      const [avatarUrl, coverImageUrl, resolvedCourses] = await Promise.all([
        resolveMediaUrl(mappedDetail.avatar),
        resolveMediaUrl(mappedDetail.coverImage),
        Promise.all(
          (mappedDetail.courses || []).map(async (course) => ({
            ...course,
            thumbnailUrl: await resolveMediaUrl(course.thumbnailKey),
          })),
        ),
      ]);

      setSelectedInstructor({
        ...mappedDetail,
        avatar: avatarUrl,
        coverImage: coverImageUrl,
        courses: resolvedCourses,
      });
    } catch (e) {
      console.error(e);
      setViewError(t("instructorAdmin.noResults"));
    } finally {
      setIsViewLoading(false);
    }
  };

  return (
    <section className="instructorTableSection" aria-label="Instructor Management Table">
      <div className="instructorTableCard">
        {error ? <div className="instructorTableError" style={{ padding: 12 }}>{error}</div> : null}

        <table className="instructorTable" aria-label="Instructor List">
          <colgroup>
            <col className="instructorTableCol instructorTableCol--id" />
            <col className="instructorTableCol instructorTableCol--profile" />
            <col className="instructorTableCol instructorTableCol--classes" />
            <col className="instructorTableCol instructorTableCol--students" />
            <col className="instructorTableCol instructorTableCol--actions" />
          </colgroup>

          <thead>
            <tr>
              <th>{t("instructorAdmin.instructorId")}</th>
              <th>{t("instructorAdmin.instructorSpecialization")}</th>
              <th>{t("instructorAdmin.numberOfClasses")}</th>
              <th>{t("instructorAdmin.students")}</th>
              <th>{t("instructorAdmin.managementActions")}</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr><td colSpan="5">{t("instructorAdmin.loading")}</td></tr>
            ) : currentItems.length === 0 ? (
              <tr><td colSpan="5">{t("instructorAdmin.noResults")}</td></tr>
            ) : currentItems.map((instructor) => (
              <tr key={instructor.instructorId}>
                <td><span className="instructorTableBadge">{instructor.displayId}</span></td>
                <td>
                  <div className="instructorTableProfile">
                    <div className="instructorTableProfileText">
                      <p className="instructorTableName">{instructor.displayName}</p>
                      <p className="instructorTableEmail">{instructor.email}</p>
                      <span className="instructorTableTag">{instructor.displaySpecialization}</span>
                    </div>
                  </div>
                </td>
                <td><div className="instructorTableStat"><strong>{instructor.displayClasses}</strong></div></td>
                <td><div className="instructorTableStat"><strong>{instructor.displayStudents}</strong></div></td>
                <td>
                  <div className="instructorTableActions">
                    <button type="button" className="instructorActionButton" aria-label={t("instructorAdmin.view")} onClick={() => handleView(instructor)}><Eye size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="instructorTablePagination" style={{ padding: 12 }}>
          <button type="button" className="instructorPaginationButton" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>{t("instructorAdmin.previous")}</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} type="button" className={`instructorPaginationButton ${currentPage === p ? "instructorPaginationButton--active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
          ))}
          <button type="button" className="instructorPaginationButton" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>{t("instructorAdmin.next")}</button>
        </div>
      </div>

      <ViewTeacherModal
        instructor={selectedInstructor}
        isLoading={isViewLoading}
        error={viewError}
        onClose={() => setSelectedInstructor(null)}
      />
    </section>
  );
};

export default TeacherTable;
