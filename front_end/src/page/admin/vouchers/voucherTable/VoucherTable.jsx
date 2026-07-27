import { FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { adminNotifySuccess } from "../../../../api/NotificationApi.js";
import AdminHoverSelect from "../../shared/AdminHoverSelect";
import { useAxiosPrivate } from "../../../../hook/UseAxiosPrivate.js";
import {
  getAdminVouchersApi,
  deleteAdminVoucherApi,
} from "../../../../api/admin/VoucherApi.js";
import "./VoucherTable.css";

const statusOptions = ["All statuses", "Active", "Inactive", "Expiring Soon", "Delete"];
const pageSize = 5;
const expiringSoonDays = 7;
const deletedVoucherStorageKey = "learnova.admin.deletedVoucherIds";

const getVoucherKey = (id) => String(id ?? "");

const loadDeletedVoucherIds = () => {
  try {
    const stored = window.localStorage.getItem(deletedVoucherStorageKey);
    const ids = JSON.parse(stored || "[]");
    return new Set(Array.isArray(ids) ? ids.map(getVoucherKey) : []);
  } catch {
    return new Set();
  }
};

const saveDeletedVoucherIds = (ids) => {
  window.localStorage.setItem(deletedVoucherStorageKey, JSON.stringify([...ids]));
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-GB");
};

const formatUsd = (value) => {
  const amount = Number(value) || 0;
  const body = Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2).replace(/\.?0+$/, "");
  return `$${body}`;
};

const formatDiscount = (voucher) => {
  if (!voucher?.discountType || voucher?.discountValue == null) return "";
  const type = String(voucher.discountType).toLowerCase();
  if (type.includes("percent")) return `${voucher.discountValue}%`;
  return formatUsd(voucher.discountValue);
};

const VoucherTable = ({
  onCreateVoucher,
  onViewVoucher,
  onEditVoucher,
  onVoucherDeleted,
  refreshKey,
}) => {
  const { t } = useTranslation();
  const axiosPrivate = useAxiosPrivate();
  const [vouchers, setVouchers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(statusOptions[0]);
  const [pagination, setPagination] = useState({
    page: 1,
    searchTerm: "",
    selectedStatus: statusOptions[0],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletedVoucherIds, setDeletedVoucherIds] = useState(loadDeletedVoucherIds);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchVouchers = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await getAdminVouchersApi(axiosPrivate);
        if (mounted) {
          setVouchers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err?.response?.data?.message || "Failed to load voucher list."
          );
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchVouchers();
    return () => {
      mounted = false;
    };
  }, [axiosPrivate, refreshKey]);

  const normalizedVouchers = useMemo(
    () =>
      vouchers.map((item) => {
        const now = new Date();
        const endDate = item.endDate ? new Date(item.endDate) : null;
        const isExpired = endDate && endDate < now;
        const expiresInMs = endDate ? endDate.getTime() - now.getTime() : Infinity;
        const isExpiringSoon =
          Boolean(endDate) &&
          !isExpired &&
          expiresInMs <= expiringSoonDays * 24 * 60 * 60 * 1000;
        const usageLimit = Number(item.usageLimit || 0);
        const usedCount = Number(item.usedCount || 0);
        const isUsageLimitReached = usageLimit > 0 && usedCount >= usageLimit;
        const isDeleted =
          deletedVoucherIds.has(getVoucherKey(item.id)) ||
          item.isActive === false;
        const isActive =
          !isDeleted && Boolean(item.isActive) && !isExpired && !isUsageLimitReached;
        const status = isDeleted
          ? "Delete"
          : isActive
            ? isExpiringSoon
              ? "Expiring Soon"
              : "Active"
            : "Inactive";
        const statusClass = isDeleted
          ? "deleted"
          : isActive
            ? isExpiringSoon
              ? "expiring"
              : "active"
            : "expired";

        return {
          id: item.id,
          code: item.code || "",
          name: item.description || "",
          discount: formatDiscount(item),
          used: `${item.usedCount ?? 0} / ${item.usageLimit ?? "-"}`,
          expires: formatDate(item.endDate),
          status,
          statusClass,
          raw: item,
        };
      }),
    [deletedVoucherIds, vouchers]
  );

  const translatedStatusOptions = statusOptions.map((status) => ({
    value: status,
    label: t(`opsAdmin.status.${status.replaceAll(" ", "").toLowerCase()}`),
  }));

  const filteredVouchers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return normalizedVouchers.filter((voucher) => {
      const text =
        [voucher.code, voucher.name, voucher.discount, voucher.used]
          .join(" ")
          .toLowerCase();
      const matchesSearch = !keyword || text.includes(keyword);
      const matchesStatus =
        selectedStatus === "All statuses" || voucher.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [normalizedVouchers, searchTerm, selectedStatus]);

  const currentPage =
    pagination.searchTerm === searchTerm && pagination.selectedStatus === selectedStatus
      ? pagination.page
      : 1;

  const setCurrentPage = (getNextPage) => {
    setPagination((currentPagination) => {
      const currentSearchPage =
        currentPagination.searchTerm === searchTerm &&
        currentPagination.selectedStatus === selectedStatus
          ? currentPagination.page
          : 1;
      const nextPage =
        typeof getNextPage === "function" ? getNextPage(currentSearchPage) : getNextPage;

      return {
        page: nextPage,
        searchTerm,
        selectedStatus,
      };
    });
  };

  const totalPages = Math.max(1, Math.ceil(filteredVouchers.length / pageSize));
  const currentPageItems = filteredVouchers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const openDeleteModal = (voucher) => {
    setDeleteTarget(voucher);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const deletedVoucher = await deleteAdminVoucherApi(deleteTarget.id, axiosPrivate);
      setVouchers((current) =>
        current.map((voucher) =>
          voucher.id === deleteTarget.id ? deletedVoucher : voucher
        )
      );
      setDeletedVoucherIds((current) => {
        const next = new Set(current);
        next.add(getVoucherKey(deleteTarget.id));
        saveDeletedVoucherIds(next);
        return next;
      });
      onVoucherDeleted?.();
      setDeleteTarget(null);
      await adminNotifySuccess("Voucher status changed to delete.", { title: "Vouchers" });
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to delete voucher.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="voucherTableSection">
      <div className="voucherTableHeader">
        <div>
          <h2 className="voucherTableTitle">{t("opsAdmin.archive")}</h2>
          <p className="voucherTableSubtitle">
            {t("opsAdmin.archiveSubtitle")}
          </p>
        </div>
        <span className="voucherTableCount">
          {t("opsAdmin.countItems", { count: filteredVouchers.length })}
        </span>
      </div>

      <div className="voucherTableCard">
        <div className="voucherTableControls">
          <input
            type="text"
            placeholder={t("opsAdmin.searchVoucher")}
            className="voucherSearchInput"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <AdminHoverSelect
            className="voucherStatusSelect"
            options={translatedStatusOptions}
            value={selectedStatus}
            onChange={setSelectedStatus}
            ariaLabel={t("opsAdmin.filterStatus")}
          />
          <button
            type="button"
            className="voucherCreateBtn"
            onClick={onCreateVoucher}
          >
            {t("opsAdmin.createVoucher")}
          </button>
        </div>

        <div className="voucherTableWrapper">
          <table className="voucherTable">
            <thead>
              <tr>
                <th>{t("opsAdmin.code")}</th>
                <th>{t("opsAdmin.campaignName")}</th>
                <th>{t("opsAdmin.discount")}</th>
                <th>{t("opsAdmin.usedCapacity")}</th>
                <th>{t("opsAdmin.expiryDate")}</th>
                <th>{t("revenueDetails.status")}</th>
                <th>{t("opsAdmin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="voucherTableLoading">
                    {t("opsAdmin.loadingVouchers")}
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="voucherTableError">
                    {error}
                  </td>
                </tr>
              ) : currentPageItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="voucherTableEmpty">
                    {t("opsAdmin.noVouchers")}
                  </td>
                </tr>
              ) : (
                currentPageItems.map((v) => (
                  <tr key={v.id}>
                    <td>{v.code}</td>
                    <td>{v.name}</td>
                    <td>{v.discount}</td>
                    <td>{v.used}</td>
                    <td>{v.expires}</td>
                    <td>
                      <span className={`voucherBadge ${v.statusClass}`}>
                        {t(`opsAdmin.status.${v.status.replaceAll(" ", "").toLowerCase()}`)}
                      </span>
                    </td>
                    <td>
                      <div className="voucherActions">
                        <button
                          className="voucherActionBtn"
                          title="View"
                          aria-label={`View voucher ${v.code}`}
                          onClick={() => onViewVoucher?.(v.raw)}
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          className="voucherActionBtn"
                          title="Edit"
                          aria-label={`Edit voucher ${v.code}`}
                          onClick={() => onEditVoucher?.(v.raw)}
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          className="voucherActionBtn"
                          title="Delete"
                          aria-label={`Delete voucher ${v.code}`}
                          onClick={() => openDeleteModal(v)}
                          disabled={v.status === "Delete"}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="voucherTablePagination">
          <button
            type="button"
            className="voucherPaginationBtn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
          >
            {t("opsAdmin.previous")}
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                type="button"
                className={`voucherPaginationBtn ${
                  page === currentPage ? "voucherPaginationBtn--active" : ""
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            )
          )}

          <button
            type="button"
            className="voucherPaginationBtn"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((page) => Math.min(page + 1, totalPages))
            }
          >
            {t("opsAdmin.next")}
          </button>
        </div>
      </div>

      {deleteTarget && (
        <div
          className="voucherDeleteModalBackdrop"
          role="presentation"
          onClick={closeDeleteModal}
        >
          <div
            className="voucherDeleteModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="voucher-delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="voucherDeleteModalIcon">
              <FiTrash2 size={24} />
            </div>
            <h3 id="voucher-delete-title">{t("opsAdmin.deleteVoucherQuestion")}</h3>
            <p>
              {t("opsAdmin.deleteVoucherDescription", { code: deleteTarget.code })}
            </p>
            <div className="voucherDeleteModalActions">
              <button
                type="button"
                className="voucherDeleteCancelBtn"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                {t("opsAdmin.cancel")}
              </button>
              <button
                type="button"
                className="voucherDeleteConfirmBtn"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? t("opsAdmin.deleting") : t("opsAdmin.confirmDelete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default VoucherTable;
