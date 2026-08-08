import { useState } from "react";
import "./Vouchers.css";
import VoucherCards from "./voucher_card/VoucherCards.jsx";
import VoucherChart from "./voucher_chart/VoucherChart.jsx";
import VoucherCampaignChart from "./voucher_campaign_chart/VoucherCampaignChart.jsx";
import VoucherTable from "./voucher_table/VoucherTable.jsx";
import VoucherHistory from "./voucher_history/VoucherHistory.jsx";
import VoucherCreate from "./voucher_create/VoucherCreate.jsx";

const Vouchers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | view | edit
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const openCreate = () => {
    setSelectedVoucher(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const openView = (voucher) => {
    setSelectedVoucher(voucher);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const openEdit = (voucher) => {
    setSelectedVoucher(voucher);
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleSaved = () => {
    setRefreshKey((prev) => prev + 1);
    setIsModalOpen(false);
  };

  return (
    <section className="vouchersPage">
      <VoucherCards refreshKey={refreshKey} />
      <div className="voucherChartsRow">
        <div className="voucherChartColumn">
          <VoucherChart refreshKey={refreshKey} />
        </div>
        <div className="voucherChartColumn">
          <VoucherCampaignChart refreshKey={refreshKey} />
        </div>
      </div>

      <VoucherTable
        onCreateVoucher={openCreate}
        onViewVoucher={openView}
        onEditVoucher={openEdit}
        onVoucherDeleted={() => setRefreshKey((prev) => prev + 1)}
        refreshKey={refreshKey}
      />

      <VoucherHistory refreshKey={refreshKey} />

      {isModalOpen && (
        <div
          className="voucherModalBackdrop"
          role="presentation"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="voucherModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="voucher-create-title"
            onClick={(event) => event.stopPropagation()}
          >
            <VoucherCreate
              mode={modalMode}
              voucher={selectedVoucher}
              onClose={() => setIsModalOpen(false)}
              onEdit={() => setModalMode("edit")}
              onSaved={handleSaved}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default Vouchers;
