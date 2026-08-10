import { AlertTriangle, Edit3, FolderTree, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { adminNotifySuccess } from "../../../notification/infrastructure/api/NotificationApi";
import {
  createAdminCategoryApi,
  deleteAdminCategoryApi,
  getAdminCategoriesApi,
  updateAdminCategoryApi,
} from "../../infrastructure/api/CategoryApi";
import AdminHoverSelect from "../shared/AdminHoverSelect";
import { useAxiosPrivate } from "../../../../shared/hooks/useAxiosPrivate";
import "./Category";

const pageSize = 6;

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

const normalizeCategory = (category) => ({
  id: category.id,
  displayId: `CAT-${String(category.id).padStart(3, "0")}`,
  name: category.name ?? "N/A",
  parentId: category.parentId ?? null,
  parentName: category.parentName ?? null,
  isDeleted: Boolean(category.isDeleted),
  status: category.isDeleted ? "Hidden" : "Active",
  createdAt: formatDate(category.createdAt),
  updatedAt: formatDate(category.updatedAt),
});

const getCategoryStats = (categories, t) => {
  const activeCategories = categories.filter((c) => !c.isDeleted).length;
  const hiddenCategories = categories.filter((c) => c.isDeleted).length;
  const rootCategories = categories.filter((c) => c.parentId == null).length;

  return [
    { label: t("categoryAdmin.total"), value: categories.length, note: t("categoryAdmin.database") },
    { label: t("categoryAdmin.activeTopics"), value: activeCategories, note: t("categoryAdmin.visible") },
    { label: t("categoryAdmin.hiddenTopics"), value: hiddenCategories, note: t("categoryAdmin.notVisible") },
    { label: t("categoryAdmin.rootCategories"), value: rootCategories, note: t("categoryAdmin.noParent") },
  ];
};

const ParentSelect = ({ value, onChange, categories, excludeId, className }) => (
  <select className={className} value={value ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}>
    <option value="">— None (root) —</option>
    {categories
      .filter((c) => !c.isDeleted && c.id !== excludeId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
  </select>
);

const Category = () => {
  const { t } = useTranslation();
  const axiosPrivate = useAxiosPrivate();
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await getAdminCategoriesApi(axiosPrivate);
        const normalized = Array.isArray(response) ? response.map(normalizeCategory) : [];
        if (isMounted) setCategories(normalized);
      } catch (fetchError) {
        if (isMounted) setError(fetchError?.response?.data?.message || "Failed to load categories.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchCategories();
    return () => { isMounted = false; };
  }, [axiosPrivate]);

  const categoryStats = useMemo(() => getCategoryStats(categories, t), [categories, t]);
  const statusOptions = useMemo(() => ["All", "Active", "Hidden"], []);

  const filteredCategories = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return categories.filter((category) => {
      const matchesSearch =
        !keyword ||
        [category.displayId, category.name, category.parentName ?? ""].join(" ").toLowerCase().includes(keyword);
      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "Active" && !category.isDeleted) ||
        (selectedStatus === "Hidden" && category.isDeleted);
      return matchesSearch && matchesStatus;
    });
  }, [categories, searchTerm, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const visibleCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategories.slice(start, start + pageSize);
  }, [currentPage, filteredCategories]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedStatus]);

  const [createForm, setCreateForm] = useState({ name: "", parentId: null, status: "Active" });
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!confirmDeleteCategory) return;
    setIsDeleting(true);
    try {
      await deleteAdminCategoryApi(confirmDeleteCategory.id, axiosPrivate);
      setCategories((current) =>
        current.map((item) =>
          item.id === confirmDeleteCategory.id ? { ...item, isDeleted: true, status: "Hidden" } : item,
        ),
      );
      setConfirmDeleteCategory(null);
    } catch (deleteError) {
      setError(deleteError?.response?.data?.message || "Failed to delete category.");
      setConfirmDeleteCategory(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreate = () => {
    setEditingCategory(null);
    setCreateForm({ name: "", parentId: null, status: "Active" });
    setCreateError("");
    setIsCreateOpen(true);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setCreateForm({
      name: category.name === "N/A" ? "" : category.name,
      parentId: category.parentId ?? null,
      status: category.isDeleted ? "Hidden" : "Active",
    });
    setCreateError("");
    setIsCreateOpen(true);
  };

  const closeModal = () => {
    setIsCreateOpen(false);
    setEditingCategory(null);
    setCreateForm({ name: "", parentId: null, status: "Active" });
    setCreateError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) { setCreateError("Category name is required"); return; }
    setIsCreating(true);
    setCreateError("");
    try {
      if (editingCategory) {
        const updated = await updateAdminCategoryApi(
          editingCategory.id,
          {
            name: createForm.name.trim(),
            parentId: createForm.parentId,
            isDeleted: createForm.status === "Hidden",
          },
          axiosPrivate,
        );
        setCategories((current) =>
          current.map((c) => (c.id === editingCategory.id ? normalizeCategory(updated) : c)),
        );
      } else {
        const newCategory = await createAdminCategoryApi(
          { name: createForm.name.trim(), parentId: createForm.parentId },
          axiosPrivate,
        );
        setCategories((current) => [...current, normalizeCategory(newCategory)]);
      }
      await adminNotifySuccess(
        editingCategory ? "Category updated successfully!" : "Category created successfully!",
        { title: "Categories" },
      );
      closeModal();
    } catch (err) {
      const msg = err?.response?.data?.message || `Failed to ${editingCategory ? "update" : "create"} category.`;
      setCreateError(msg);
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="adminCategoryPage" aria-label="Category management">
      <div className="adminCategoryContent">
        <div className="adminCategoryStats">
          {categoryStats.map((item) => (
            <article className="adminCategoryStatCard" key={item.label}>
              <span className="adminCategoryStatIcon">
                <FolderTree size={22} />
              </span>
              <div>
                <strong>{item.value}</strong>
                <p>{item.label}</p>
                <small>{item.note}</small>
              </div>
            </article>
          ))}
        </div>

        <div className="adminCategoryFilters">
          <input
            type="search"
            placeholder={t("categoryAdmin.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <AdminHoverSelect
            className="adminCategoryFilterSelect"
            options={statusOptions.map((status) => ({ value: status, label: status === "All" ? t("categoryAdmin.all") : t(`categoryAdmin.${status.toLowerCase()}`) }))}
            value={selectedStatus}
            onChange={setSelectedStatus}
            ariaLabel="Filter by status"
          />
          <button type="button" className="adminCategoryCreateButton" onClick={openCreate}>
            <Plus size={18} />
            + {t("categoryAdmin.new")}
          </button>
        </div>

        {error ? <p className="adminCategoryError">{error}</p> : null}

        <div className="adminCategoryTableCard">
          <table className="adminCategoryTable">
            <thead>
              <tr>
                <th>{t("categoryAdmin.categoryId")}</th><th>{t("categoryAdmin.categoryName")}</th><th>{t("categoryAdmin.parent")}</th><th>{t("categoryAdmin.status")}</th><th>{t("categoryAdmin.updated")}</th><th>{t("categoryAdmin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleCategories.map((category) => (
                <tr key={category.id}>
                  <td>{category.displayId}</td>
                  <td>{category.name}</td>
                  <td>{category.parentName ?? <span style={{ color: "#94a3b8" }}>—</span>}</td>
                  <td>
                    <span className={`adminCategoryStatus adminCategoryStatus--${category.status.toLowerCase()}`}>
                      {t(`categoryAdmin.${category.status.toLowerCase()}`)}
                    </span>
                  </td>
                  <td>{category.updatedAt}</td>
                  <td>
                    <div className="adminCategoryActions">
                      <button type="button" aria-label={`Edit ${category.name}`} onClick={() => openEdit(category)}>
                        <Edit3 size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${category.name}`}
                        onClick={() => setConfirmDeleteCategory(category)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && visibleCategories.length === 0 ? (
                <tr><td colSpan={6} className="adminCategoryEmpty">{t("categoryAdmin.empty")}</td></tr>
              ) : null}
              {isLoading ? (
                <tr><td colSpan={6} className="adminCategoryEmpty">Loading categories...</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="adminCategoryPagination">
          <button
            type="button"
            className="adminCategoryPageButton"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          >
            {t("categoryAdmin.previous")}
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              className={`adminCategoryPageButton ${currentPage === page ? "adminCategoryPageButton--active" : ""}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            className="adminCategoryPageButton"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          >
            {t("categoryAdmin.next")}
          </button>
        </div>
      </div>

      {isCreateOpen && (
        <div className="adminCategoryModalBackdrop" role="presentation" onClick={closeModal}>
          <form
            className="adminCategoryModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-category-modal-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <div className="adminCategoryModalHeader">
              <div>
                <h2 id="admin-category-modal-title">
                  {editingCategory ? t("categoryAdmin.edit") : t("categoryAdmin.create")}
                </h2>
                <p>
                  {editingCategory
                    ? `Editing: ${editingCategory.name}`
                    : "Add a course category for catalog classification."}
                </p>
              </div>
              <button type="button" className="adminCategoryModalClose" onClick={closeModal} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="adminCategoryModalForm">
              <label>
                Category Name
                <input
                  type="text"
                  placeholder="Example: Frontend Development"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                />
              </label>

              <label>
                Parent Category
                <ParentSelect
                  value={createForm.parentId}
                  onChange={(val) => setCreateForm((f) => ({ ...f, parentId: val }))}
                  categories={categories}
                  excludeId={editingCategory?.id ?? null}
                />
              </label>

              {editingCategory && (
                <label className="adminCategoryModalFieldWide">
                  Status
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="Active">{t("categoryAdmin.active")}</option>
                    <option value="Hidden">{t("categoryAdmin.hidden")}</option>
                  </select>
                </label>
              )}

              {createError ? <p className="adminCategoryError">{createError}</p> : null}

              <div className="adminCategoryModalActions">
                <button type="button" className="adminCategoryModalCancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="adminCategoryModalSubmit" disabled={isCreating}>
                  {isCreating
                    ? (editingCategory ? "Saving..." : "Creating...")
                    : (editingCategory ? "Save Category" : "Create Category")}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      {confirmDeleteCategory && (
        <div className="adminCategoryModalBackdrop" role="presentation" onClick={() => setConfirmDeleteCategory(null)}>
          <div
            className="adminCategoryConfirmModal"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm delete"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="adminCategoryConfirmIcon">
              <AlertTriangle size={28} />
            </div>
            <h3>Hide this category?</h3>
            <p>
              <strong>{confirmDeleteCategory.name}</strong> will be set to Hidden and no longer visible to users. You can restore it later via Edit.
            </p>
            <div className="adminCategoryConfirmActions">
              <button
                type="button"
                className="adminCategoryModalCancel"
                onClick={() => setConfirmDeleteCategory(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="adminCategoryConfirmDelete"
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

export default Category;
