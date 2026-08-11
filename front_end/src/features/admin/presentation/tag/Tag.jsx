import { AlertTriangle, Edit3, Plus, Tag as TagIcon, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { adminNotifySuccess } from "../../../notification/infrastructure/api/NotificationApi";
import {
  createAdminTagApi,
  deleteAdminTagApi,
  getAdminTagCoursesDropdownApi,
  getAdminTagsApi,
  updateAdminTagApi,
} from "../../infrastructure/api/TagApi";
import AdminHoverSelect from "../shared/AdminHoverSelect";
import { useAxiosPrivate } from "../../../../shared/hooks/useAxiosPrivate";
import "./Tag.css";

const pageSize = 8;

const toSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const normalizeTag = (tag) => ({
  id: tag.id,
  displayId: `TAG-${String(tag.id).padStart(3, "0")}`,
  name: tag.name ?? "N/A",
  slug: tag.slug ?? "",
  courseId: tag.courseId ?? null,
  courseTitle: tag.courseTitle ?? null,
  isDeleted: Boolean(tag.isDeleted),
  status: tag.isDeleted ? "Hidden" : "Active",
  updatedAt: formatDate(tag.updatedAt),
});

const getTagStats = (tags, t) => {
  const active = tags.filter((t) => !t.isDeleted).length;
  const hidden = tags.filter((t) => t.isDeleted).length;
  const withCourse = tags.filter((t) => t.courseId != null).length;
  return [
    { label: t("tagAdmin.total"), value: tags.length, note: t("tagAdmin.database") },
    { label: t("tagAdmin.active"), value: active, note: t("tagAdmin.visible") },
    { label: t("tagAdmin.hidden"), value: hidden, note: t("tagAdmin.notVisible") },
    { label: t("tagAdmin.attached"), value: withCourse, note: t("tagAdmin.linked") },
  ];
};

const CourseSelect = ({ value, onChange, courses }) => (
  <select
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
  >
    <option value="">— None —</option>
    {courses.map((c) => (
      <option key={c.id} value={c.id}>
        {c.title}
      </option>
    ))}
  </select>
);

const Tag = () => {
  const { t } = useTranslation();
  const axiosPrivate = useAxiosPrivate();
  const [tags, setTags] = useState([]);
  const [courses, setCourses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError("");
        const [tagsRes, coursesRes] = await Promise.all([
          getAdminTagsApi(axiosPrivate),
          getAdminTagCoursesDropdownApi(axiosPrivate),
        ]);
        if (isMounted) {
          setTags(Array.isArray(tagsRes) ? tagsRes.map(normalizeTag) : []);
          setCourses(Array.isArray(coursesRes) ? coursesRes : []);
        }
      } catch (fetchError) {
        if (isMounted) setError(fetchError?.response?.data?.message || "Failed to load data.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [axiosPrivate]);

  const tagStats = useMemo(() => getTagStats(tags, t), [tags, t]);
  const statusOptions = useMemo(() => ["All", "Active", "Hidden"], []);

  const filteredTags = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return tags.filter((tag) => {
      const matchesSearch =
        !keyword ||
        [tag.displayId, tag.name, tag.courseTitle ?? ""].join(" ").toLowerCase().includes(keyword);
      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "Active" && !tag.isDeleted) ||
        (selectedStatus === "Hidden" && tag.isDeleted);
      return matchesSearch && matchesStatus;
    });
  }, [tags, searchTerm, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredTags.length / pageSize));
  const visibleTags = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTags.slice(start, start + pageSize);
  }, [currentPage, filteredTags]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedStatus]);

  const [createForm, setCreateForm] = useState({ name: "", courseId: null, status: "Active" });
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDeleteTag, setConfirmDeleteTag] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openCreate = () => {
    setEditingTag(null);
    setCreateForm({ name: "", courseId: null, status: "Active" });
    setCreateError("");
    setIsCreateOpen(true);
  };

  const openEdit = (tag) => {
    setEditingTag(tag);
    setCreateForm({
      name: tag.name === "N/A" ? "" : tag.name,
      courseId: tag.courseId ?? null,
      status: tag.isDeleted ? "Hidden" : "Active",
    });
    setCreateError("");
    setIsCreateOpen(true);
  };

  const closeModal = () => {
    setIsCreateOpen(false);
    setEditingTag(null);
    setCreateForm({ name: "", courseId: null, status: "Active" });
    setCreateError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) { setCreateError("Tag name is required"); return; }
    setIsCreating(true);
    setCreateError("");
    try {
      if (editingTag) {
        const updated = await updateAdminTagApi(
          editingTag.id,
          {
            name: createForm.name.trim(),
            slug: toSlug(createForm.name.trim()),
            courseId: createForm.courseId,
            isDeleted: createForm.status === "Hidden",
          },
          axiosPrivate,
        );
        setTags((current) =>
          current.map((t) => (t.id === editingTag.id ? normalizeTag(updated) : t)),
        );
      } else {
        const newTag = await createAdminTagApi(
          {
            name: createForm.name.trim(),
            slug: toSlug(createForm.name.trim()),
            courseId: createForm.courseId,
          },
          axiosPrivate,
        );
        setTags((current) => [...current, normalizeTag(newTag)]);
      }
      await adminNotifySuccess(
        editingTag ? "Tag updated successfully!" : "Tag created successfully!",
        { title: "Tags" },
      );
      closeModal();
    } catch (err) {
      const msg = err?.response?.data?.message || `Failed to ${editingTag ? "update" : "create"} tag.`;
      setCreateError(msg);
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteTag) return;
    setIsDeleting(true);
    try {
      await deleteAdminTagApi(confirmDeleteTag.id, axiosPrivate);
      setTags((current) =>
        current.map((item) =>
          item.id === confirmDeleteTag.id ? { ...item, isDeleted: true, status: "Hidden" } : item,
        ),
      );
      setConfirmDeleteTag(null);
    } catch (deleteError) {
      setError(deleteError?.response?.data?.message || "Failed to delete tag.");
      setConfirmDeleteTag(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="adminTagPage" aria-label="Tag management">
      <div className="adminTagContent">
        <div className="adminTagStats">
          {tagStats.map((item) => (
            <article className="adminTagStatCard" key={item.label}>
              <span className="adminTagStatIcon">
                <TagIcon size={22} />
              </span>
              <div>
                <strong>{item.value}</strong>
                <p>{item.label}</p>
                <small>{item.note}</small>
              </div>
            </article>
          ))}
        </div>

        <div className="adminTagFilters">
          <input
            type="search"
            placeholder={t("tagAdmin.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <AdminHoverSelect
            className="adminTagFilterSelect"
            options={statusOptions}
            value={selectedStatus}
            onChange={setSelectedStatus}
            ariaLabel="Filter by status"
          />
          <button type="button" className="adminTagCreateButton" onClick={openCreate}>
            <Plus size={18} />
            + {t("tagAdmin.new")}
          </button>
        </div>

        {error ? <p className="adminTagError">{error}</p> : null}

        <div className="adminTagTableCard">
          <table className="adminTagTable">
            <thead>
              <tr>
                <th>{t("tagAdmin.tagId")}</th><th>{t("tagAdmin.tagName")}</th><th>{t("tagAdmin.course")}</th><th>{t("tagAdmin.status")}</th><th>{t("tagAdmin.updated")}</th><th>{t("tagAdmin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleTags.map((tag) => (
                <tr key={tag.id}>
                  <td>{tag.displayId}</td>
                  <td>{tag.name}</td>
                  <td>{tag.courseTitle ?? <span style={{ color: "#94a3b8" }}>—</span>}</td>
                  <td>
                    <span className={`adminTagStatus adminTagStatus--${tag.status.toLowerCase()}`}>
                      {tag.status}
                    </span>
                  </td>
                  <td>{tag.updatedAt}</td>
                  <td>
                    <div className="adminTagActions">
                      <button type="button" aria-label={`Edit ${tag.name}`} onClick={() => openEdit(tag)}>
                        <Edit3 size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${tag.name}`}
                        onClick={() => setConfirmDeleteTag(tag)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && visibleTags.length === 0 ? (
                <tr><td colSpan={6} className="adminTagEmpty">{t("tagAdmin.empty")}</td></tr>
              ) : null}
              {isLoading ? (
                <tr><td colSpan={6} className="adminTagEmpty">Loading tags...</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="adminTagPagination">
          <button
            type="button"
            className="adminTagPageButton"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          >
            {t("tagAdmin.previous")}
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              className={`adminTagPageButton ${currentPage === page ? "adminTagPageButton--active" : ""}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            className="adminTagPageButton"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          >
            {t("tagAdmin.next")}
          </button>
        </div>
      </div>

      {isCreateOpen && (
        <div className="adminTagModalBackdrop" role="presentation" onClick={closeModal}>
          <form
            className="adminTagModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-tag-modal-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="adminTagModalHeader">
              <div>
                <h2 id="admin-tag-modal-title">
                  {editingTag ? t("tagAdmin.edit") : t("tagAdmin.create")}
                </h2>
                <p>
                  {editingTag
                    ? `Editing: ${editingTag.name}`
                    : "Tags help users search and filter courses."}
                </p>
              </div>
              <button type="button" className="adminTagModalClose" onClick={closeModal} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="adminTagModalForm">
              <label>
                Tag Name
                <input
                  type="text"
                  placeholder="Example: React, Machine Learning"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </label>

              <label>
                Course
                <CourseSelect
                  value={createForm.courseId}
                  onChange={(val) => setCreateForm((f) => ({ ...f, courseId: val }))}
                  courses={courses}
                />
              </label>

              {editingTag && (
                <label className="adminTagModalFieldWide">
                  Status
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="Active">{t("tagAdmin.activeStatus")}</option>
                    <option value="Hidden">{t("tagAdmin.hiddenStatus")}</option>
                  </select>
                </label>
              )}

              {createError ? <p className="adminTagError adminTagModalFieldWide">{createError}</p> : null}

              <div className="adminTagModalActions">
                <button type="button" className="adminTagModalCancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="adminTagModalSubmit" disabled={isCreating}>
                  {isCreating
                    ? (editingTag ? "Saving..." : "Creating...")
                    : (editingTag ? "Save Tag" : "Create Tag")}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {confirmDeleteTag && (
        <div className="adminTagModalBackdrop" role="presentation" onClick={() => setConfirmDeleteTag(null)}>
          <div
            className="adminTagConfirmModal"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm delete"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adminTagConfirmIcon">
              <AlertTriangle size={28} />
            </div>
            <h3>Hide this tag?</h3>
            <p>
              <strong>{confirmDeleteTag.name}</strong> will be set to Hidden and no longer visible to users. You can restore it later via Edit.
            </p>
            <div className="adminTagConfirmActions">
              <button
                type="button"
                className="adminTagModalCancel"
                onClick={() => setConfirmDeleteTag(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="adminTagConfirmDelete"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Hiding..." : "Yes, Hide"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Tag;
