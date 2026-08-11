import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Gift, Search, TicketPercent } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../../../shared/hooks/useAuth";
import { useAxiosPrivate } from "../../../../../shared/hooks/useAxiosPrivate";
import { claimVoucherApi, getAvailableVouchersApi } from "../../../../course/infrastructure/api/VoucherApi";
import "./VouchersSection.css";

const formatMoney = (value) => `$${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const formatDate = (value) => value ? new Date(value).toLocaleDateString("vi-VN") : "—";

const mapVoucher = (voucher) => {
  const isPercent = voucher.discountType === "Percent";
  return {
    ...voucher,
    discount: `${isPercent ? Number(voucher.discountValue || 0).toLocaleString("en-US") : formatMoney(voucher.discountValue)}${isPercent ? "%" : ""}`,
    type: isPercent ? "percent" : "fixed",
    expires: formatDate(voucher.endDate),
    status: voucher.claimed ? "claimed" : "available",
    title: voucher.description || voucher.code,
    description: voucher.description || voucher.code,
  };
};

const VouchersSection = () => {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [allVouchers, setAllVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  useEffect(() => {
    let mounted = true;
    const loadVouchers = async () => {
      try {
        const data = await getAvailableVouchersApi(axiosPrivate, accessToken);
        if (mounted) setAllVouchers((data || []).map(mapVoucher));
      } catch {
        if (mounted) setError(t("profile.vouchers.loadError"));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadVouchers();
    return () => { mounted = false; };
  }, [accessToken, axiosPrivate, t]);

  const vouchers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return allVouchers.filter((voucher) => {
      const matchesSearch = !keyword || `${voucher.code} ${voucher.title} ${voucher.description}`.toLowerCase().includes(keyword);
      const isClaimed = voucher.status === "claimed";
      const expiresSoon = voucher.endDate && new Date(voucher.endDate).getTime() - Date.now() <= 30 * 24 * 60 * 60 * 1000;
      const matchesTab = activeTab === "all"
        || (activeTab === "available" && !isClaimed)
        || (activeTab === "claimed" && isClaimed)
        || (activeTab === "expiring" && expiresSoon);
      return matchesSearch && matchesTab;
    });
  }, [activeTab, allVouchers, search]);

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(vouchers.length / pageSize));
  const pageVouchers = vouchers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const claimVoucher = async (voucherId) => {
    try {
      const claimed = await claimVoucherApi(axiosPrivate, voucherId, accessToken);
      setAllVouchers((current) => current.map((voucher) => voucher.voucherId === voucherId ? mapVoucher(claimed) : voucher));
    } catch (claimError) {
      setError(claimError.response?.data?.message || t("profile.vouchers.claimError"));
    }
  };

  const copyCode = async (code) => {
    await navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(""), 1800);
  };

  return (
    <section className="vouchers-section">
      <div className="vouchers-hero">
        <div>
          <span className="vouchers-eyebrow"><TicketPercent size={16} /> {t("profile.vouchers.eyebrow")}</span>
          <h1>{t("profile.vouchers.title")}</h1>
          <p>{t("profile.vouchers.subtitle")}</p>
        </div>
        <div className="vouchers-hero-art"><div className="vouchers-hero-ticket"><TicketPercent size={54} /></div><span>%</span><span>✦</span></div>
      </div>

      <div className="vouchers-toolbar">
        <div className="vouchers-tabs" role="tablist">
          {["all", "available", "claimed", "expiring"].map((tab) => (
            <button key={tab} type="button" className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
              {t(`profile.vouchers.tabs.${tab}`)}
            </button>
          ))}
        </div>
        <label className="vouchers-search">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("profile.vouchers.searchPlaceholder")} />
        </label>
      </div>

      {error ? <div className="vouchers-error">{error}</div> : null}
      {isLoading ? (
        <div className="vouchers-empty"><p>{t("profile.vouchers.loading")}</p></div>
      ) : vouchers.length === 0 ? (
        <div className="vouchers-empty"><TicketPercent size={42} /><h2>{t("profile.vouchers.emptyTitle")}</h2><p>{t("profile.vouchers.emptySubtitle")}</p></div>
      ) : (
        <div className="vouchers-grid">
          {pageVouchers.map((voucher) => {
            const isClaimed = voucher.status === "claimed";
            return (
              <article className={`voucher-card voucher-card-${voucher.voucherId} ${isClaimed ? "is-claimed" : ""}`} key={voucher.voucherId}>
                <div className="voucher-discount-panel"><TicketPercent size={42} /><strong>{voucher.discount}</strong><span>{voucher.type === "percent" ? t("profile.vouchers.off") : t("profile.vouchers.offFixed")}</span></div>
                <div className="voucher-card-content">
                  <div className="voucher-card-top"><span className="voucher-status">{isClaimed ? <><Check size={14} /> {t("profile.vouchers.claimed")}</> : t("profile.vouchers.available")}</span></div>
                  <h2>{voucher.title}</h2>
                  <p>{voucher.description}</p>
                  <div className="voucher-code-row"><span>{voucher.code}</span><button type="button" onClick={() => copyCode(voucher.code)}><Copy size={15} /> {copiedCode === voucher.code ? t("profile.vouchers.copied") : t("profile.vouchers.copy")}</button></div>
                  <div className="voucher-meta"><span>{t("profile.vouchers.expires", { date: voucher.expires })}</span></div>
                  <button type="button" className="voucher-claim-button" disabled={isClaimed} onClick={() => claimVoucher(voucher.voucherId)}><Gift size={16} /> {isClaimed ? t("profile.vouchers.claimed") : t("profile.vouchers.claim")}</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!isLoading && vouchers.length > 0 && totalPages > 1 ? (
        <nav className="vouchers-pagination" aria-label="Voucher pagination">
          <button
            type="button"
            className="vouchers-pagination-button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              type="button"
              key={page}
              className={`vouchers-pagination-button ${page === currentPage ? "active" : ""}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            className="vouchers-pagination-button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
          >
            ›
          </button>
        </nav>
      ) : null}
    </section>
  );
};

export default VouchersSection;
