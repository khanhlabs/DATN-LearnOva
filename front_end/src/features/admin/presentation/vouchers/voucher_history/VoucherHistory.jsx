import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiClipboard } from "react-icons/fi";
import { getAdminVoucherUsageHistoriesApi } from "../../../infrastructure/api/VoucherApi";
import { useAxiosPrivate } from "../../../../../shared/hooks/useAxiosPrivate";
import "./VoucherHistory.css";

const pageSize = 10;

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const datePart = date.toLocaleDateString("en-CA");
  const timePart = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${datePart} ${timePart}`;
};

const VoucherHistory = ({ refreshKey }) => {
  const { t } = useTranslation();
  const axiosPrivate = useAxiosPrivate();
  const [histories, setHistories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ page: 1, searchTerm: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchVoucherUsageHistories = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await getAdminVoucherUsageHistoriesApi(axiosPrivate);
        if (mounted) {
          setHistories(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err?.response?.data?.message ||
              "Failed to load voucher usage history."
          );
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchVoucherUsageHistories();
    return () => {
      mounted = false;
    };
  }, [axiosPrivate, refreshKey]);

  const normalizedHistories = useMemo(
    () =>
      histories.map((history, index) => ({
        id: `${history.usedAt || "history"}-${index}`,
        student: history.studentName || "",
        course: history.registeredCourse || "",
        code: history.appliedCode || "-",
        originalPrice: formatCurrency(history.originalPrice),
        discount: formatCurrency(history.discount),
        paid: formatCurrency(history.paid),
        usedAt: formatDateTime(history.usedAt),
      })),
    [histories]
  );

  const filteredHistories = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return normalizedHistories;

    return normalizedHistories.filter((history) =>
      [history.student, history.course, history.code]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [normalizedHistories, searchTerm]);

  const currentPage = pagination.searchTerm === searchTerm ? pagination.page : 1;
  const setCurrentPage = (getNextPage) => {
    setPagination((currentPagination) => {
      const currentSearchPage =
        currentPagination.searchTerm === searchTerm ? currentPagination.page : 1;
      const nextPage =
        typeof getNextPage === "function" ? getNextPage(currentSearchPage) : getNextPage;

      return {
        page: nextPage,
        searchTerm,
      };
    });
  };

  const totalPages = Math.max(1, Math.ceil(filteredHistories.length / pageSize));
  const currentPageItems = filteredHistories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const startItem = filteredHistories.length
    ? (currentPage - 1) * pageSize + 1
    : 0;
  const endItem = Math.min(currentPage * pageSize, filteredHistories.length);

  return (
    <section className="voucherHistorySection">
      <div className="voucherHistoryHeader">
        <div>
          <div className="voucherHistoryTitleIcon">
            <FiClipboard className="voucherHistoryIcon" aria-hidden="true" />
            <h2 className="voucherHistoryTitle">{t("opsAdmin.history")}</h2>
          </div>
          <p className="voucherHistorySubtitle">
            {t("opsAdmin.historySubtitle")}
          </p>
        </div>
        <span className="voucherHistoryCount">
          {t("opsAdmin.showingItems", { start: startItem, end: endItem, count: filteredHistories.length })}
        </span>
      </div>

      <div className="voucherHistoryCard">
        <div className="voucherHistoryControls">
          <input
            type="text"
            placeholder={t("opsAdmin.searchHistory")}
            className="voucherHistorySearchInput"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="voucherHistoryTableWrapper">
          <table className="voucherHistoryTable">
            <thead>
              <tr>
                <th>{t("opsAdmin.student")}</th>
                <th>{t("opsAdmin.registeredCourse")}</th>
                <th>{t("opsAdmin.appliedCode")}</th>
                <th>{t("opsAdmin.originalPrice")}</th>
                <th>{t("opsAdmin.discount")}</th>
                <th>{t("opsAdmin.paid")}</th>
                <th>{t("opsAdmin.usedAt")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="voucherHistoryLoading">
                    {t("opsAdmin.loadingHistory")}
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="voucherHistoryError">
                    {error}
                  </td>
                </tr>
              ) : currentPageItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="voucherHistoryEmpty">
                    {t("opsAdmin.noHistory")}
                  </td>
                </tr>
              ) : (
                currentPageItems.map((history) => (
                  <tr key={history.id}>
                    <td>{history.student}</td>
                    <td>{history.course}</td>
                    <td>
                      <span className="voucherHistoryCode">{history.code}</span>
                    </td>
                    <td>{history.originalPrice}</td>
                    <td className="voucherHistoryDiscount">
                      {history.discount}
                    </td>
                    <td className="voucherHistoryFinal">{history.paid}</td>
                    <td>{history.usedAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="voucherHistoryPagination">
          <button
            type="button"
            className="voucherHistoryPaginationBtn"
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
                className={`voucherHistoryPaginationBtn ${
                  page === currentPage
                    ? "voucherHistoryPaginationBtn--active"
                    : ""
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            )
          )}

          <button
            type="button"
            className="voucherHistoryPaginationBtn"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((page) => Math.min(page + 1, totalPages))
            }
          >
            {t("opsAdmin.next")}
          </button>
        </div>
      </div>
    </section>
  );
};

export default VoucherHistory;
