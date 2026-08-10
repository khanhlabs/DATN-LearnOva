import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { adminNotifySuccess } from "../../../../notification/infrastructure/api/NotificationApi";
import { useAxiosPrivate } from "../../../../../shared/hooks/useAxiosPrivate";
import { useAuth } from "../../../../../shared/hooks/useAuth";
import {
  createAdminVoucherApi,
  updateAdminVoucherApi,
} from "../../../infrastructure/api/VoucherApi";
import "./VoucherCreate";

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatDateLabel = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-GB").format(date);
};

const getDiscountLabel = (discountType) =>
  discountType === "Percent" ? "Discount Percent" : "Discount Amount";

const getDiscountUnit = (discountType) =>
  discountType === "Percent" ? "%" : "$";

const formatUsd = (value) => {
  const amount = Number(value) || 0;
  const body = Number.isInteger(amount)
    ? String(amount)
    : amount.toFixed(2).replace(/\.?0+$/, "");
  return `$${body}`;
};

const formatDiscountPreview = (discountType, value) =>
  discountType === "Percent"
    ? `${Number(value || 0)}%`
    : formatUsd(value);

const maxVoucherMoneyValue = 99999999.99;

const getPayload = (form, currentUser, voucher) => ({
  code: form.code.trim(),
  description: form.description.trim(),
  discountType: form.discountType,
  discountValue: Number(form.discountValue || 0),
  minimumOrder: 0,
  maximumDiscountAmount: form.discountType === "Percent" ? maxVoucherMoneyValue : 0,
  usageLimit: Number(form.usageLimit || 0),
  startDate: form.startDate ? `${form.startDate}T00:00:00Z` : "",
  endDate: form.endDate ? `${form.endDate}T23:59:59Z` : "",
  isActive: Boolean(form.isActive),
  createdById: currentUser?.id ?? voucher?.createdById ?? 0,
});

const getInitialForm = (voucher) => ({
  code: voucher?.code || "",
  description: voucher?.description || "",
  discountType: voucher?.discountType || "Fixed",
  discountValue:
    voucher?.discountValue != null ? String(voucher.discountValue) : "",
  usageLimit: voucher?.usageLimit != null ? String(voucher.usageLimit) : "",
  startDate: toDateInputValue(voucher?.startDate),
  endDate: toDateInputValue(voucher?.endDate),
  isActive: voucher?.isActive !== false,
});

const VoucherCreate = ({
  mode = "create",
  voucher = null,
  onClose,
  onEdit,
  onSaved,
}) => {
  const { t } = useTranslation();
  const axiosPrivate = useAxiosPrivate();
  const { currentUser } = useAuth();
  const [form, setForm] = useState(() => getInitialForm(voucher));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const isView = mode === "view";
  const isEdit = mode === "edit";

  const handleChange = (field) => (event) => {
    const value =
      event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDiscountTypeChange = (event) => {
    setForm((prev) => ({
      ...prev,
      discountType: event.target.value,
      discountValue: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isView) return;

    if (!currentUser?.id && !voucher?.createdById) {
      setError(t("opsAdmin.identifyUser"));
      return;
    }

    if (!form.code.trim() || !form.description.trim()) {
      setError(t("opsAdmin.codeDescriptionRequired"));
      return;
    }

    if (Number(form.discountValue || 0) <= 0) {
      setError(t("opsAdmin.discountPositive"));
      return;
    }

    if (form.discountType === "Percent" && Number(form.discountValue) > 100) {
      setError(t("opsAdmin.discountPercentMax"));
      return;
    }

    if (form.discountType === "Fixed" && Number(form.discountValue) > maxVoucherMoneyValue) {
      setError(t("opsAdmin.discountAmountMax"));
      return;
    }

    if (Number(form.usageLimit || 0) < 0) {
      setError(t("opsAdmin.usageLimitNegative"));
      return;
    }

    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError(t("opsAdmin.endDateInvalid"));
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const payload = getPayload(form, currentUser, voucher);

      if (mode === "create") {
        await createAdminVoucherApi(payload, axiosPrivate);
        await adminNotifySuccess("Voucher created successfully.", { title: "Vouchers" });
      } else {
        await updateAdminVoucherApi(voucher.id, payload, axiosPrivate);
        await adminNotifySuccess("Voucher updated successfully.", { title: "Vouchers" });
      }

      onSaved?.();
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Failed to save voucher. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section
      className={`voucherCreateSection ${onClose ? "voucherCreateSection--modal" : ""}`}
    >
      <div className="voucherCreateHeader">
        <div>
          <div className="voucherCreateTitleRow">
            <span className="voucherCreateIcon">🎟️</span>
            <h2 className="voucherCreateTitle" id="voucher-create-title">
              {isView
                ? t("opsAdmin.voucherDetails")
                : isEdit
                ? t("opsAdmin.editVoucher")
                : t("opsAdmin.createVoucherTitle")}
            </h2>
          </div>
          <p className="voucherCreateSubtitle">
            {isView
              ? t("opsAdmin.viewVoucherSubtitle")
              : isEdit
              ? t("opsAdmin.editVoucherSubtitle")
              : t("opsAdmin.createVoucherSubtitle")}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            className="voucherCreateCloseBtn"
            onClick={onClose}
            aria-label="Close voucher form"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <form className="voucherCreateContent" onSubmit={handleSubmit}>
        <div className="voucherCreateFormCard">
          <div className="voucherCreateFormRow">
            <label className="voucherCreateLabel">
              {t("opsAdmin.discountCode")}
              <input
                type="text"
                value={form.code}
                onChange={handleChange("code")}
                className="voucherCreateInput"
                disabled={isView}
              />
            </label>
            <label className="voucherCreateLabel">
              {t("opsAdmin.campaignName")}
              <input
                type="text"
                value={form.description}
                onChange={handleChange("description")}
                className="voucherCreateInput"
                disabled={isView}
              />
            </label>
          </div>

          <div className="voucherCreateFormRow">
            <label className="voucherCreateLabel">
              {t("opsAdmin.discountType")}
              <select
                value={form.discountType}
                onChange={handleDiscountTypeChange}
                className="voucherCreateInput"
                disabled={isView}
              >
                <option value="Fixed">{t("opsAdmin.fixedAmount")}</option>
                <option value="Percent">{t("opsAdmin.percent")}</option>
              </select>
            </label>

            <label className="voucherCreateLabel">
              {getDiscountLabel(form.discountType)}
              <div className="voucherCreateAmountInputWrap">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max={form.discountType === "Percent" ? "100" : undefined}
                  value={form.discountValue}
                  onChange={handleChange("discountValue")}
                  className="voucherCreateInput voucherCreateAmountInput"
                  disabled={isView}
                  inputMode="decimal"
                />
                <span className="voucherCreateAmountUnit">
                  {getDiscountUnit(form.discountType)}
                </span>
              </div>
              {form.discountType === "Fixed" ? (
                <small className="voucherCreateHint">{t("opsAdmin.usdHint")}</small>
              ) : null}
            </label>
          </div>

          <div className="voucherCreateFormRow">
            <label className="voucherCreateLabel">
              {t("opsAdmin.usageLimit")}
              <input
                type="number"
                min="0"
                value={form.usageLimit}
                onChange={handleChange("usageLimit")}
                className="voucherCreateInput"
                disabled={isView}
              />
            </label>
            <label className="voucherCreateLabel">
              {t("opsAdmin.active")}
              <select
                value={form.isActive ? "true" : "false"}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isActive: event.target.value === "true",
                  }))
                }
                className="voucherCreateInput"
                disabled={isView}
              >
                <option value="true">{t("opsAdmin.active")}</option>
                <option value="false">{t("opsAdmin.inactive")}</option>
              </select>
            </label>
          </div>

          <div className="voucherCreateFormRow">
            <label className="voucherCreateLabel">
              {t("opsAdmin.startDate")}
              <input
                type="date"
                value={form.startDate}
                onChange={handleChange("startDate")}
                className="voucherCreateInput"
                disabled={isView}
              />
            </label>
            <label className="voucherCreateLabel">
              {t("opsAdmin.endDate")}
              <input
                type="date"
                value={form.endDate}
                onChange={handleChange("endDate")}
                className="voucherCreateInput"
                disabled={isView}
              />
            </label>
          </div>

          {error ? <p className="voucherCreateError">{error}</p> : null}

          <div className="voucherCreateActions">
            {isView ? (
              <button
                type="button"
                className="voucherCreateSubmitBtn"
                onClick={onEdit}
              >
                {t("opsAdmin.edit")}
              </button>
            ) : (
              <button
                type="submit"
                className="voucherCreateSubmitBtn"
                disabled={isSaving}
              >
                {isSaving
                  ? t("opsAdmin.saving")
                  : isEdit
                  ? t("opsAdmin.saveChanges")
                  : t("opsAdmin.createVoucher")}
              </button>
            )}
            <button
              type="button"
              className="voucherCreateCancelBtn"
              onClick={onClose}
            >
              {isView ? t("opsAdmin.close") : t("opsAdmin.cancel")}
            </button>
          </div>
        </div>

        <aside className="voucherCreateSummaryCard" aria-label={t("opsAdmin.preview")}>
          <div className="voucherCreateSummaryHeader">
            <div>
              <p className="voucherCreateSummaryLabel">{t("opsAdmin.livePreview")}</p>
              <h3 className="voucherCreateSummaryTitle">
                {form.description.trim() || t("opsAdmin.newCampaign")}
              </h3>
            </div>
            <span className="voucherCreateSummaryCode">
              {form.code.trim() || t("opsAdmin.code")}
            </span>
          </div>

          <div className="voucherCreatePreviewBox">
            <span>{t("opsAdmin.discount")}</span>
            <strong>{formatDiscountPreview(form.discountType, form.discountValue)}</strong>
            <small>
              {form.discountType === "Percent" ? t("opsAdmin.percent") : t("opsAdmin.fixedAmount")}
            </small>
          </div>

          <div className="voucherCreateSummaryItem">
            <span>{t("opsAdmin.usageLimit")}</span>
            <strong>{Number(form.usageLimit || 0).toLocaleString("en-US")}</strong>
          </div>
          <div className="voucherCreateSummaryItem">
            <span>{t("revenueDetails.status")}</span>
            <strong>{form.isActive ? t("opsAdmin.active") : t("opsAdmin.inactive")}</strong>
          </div>
          <div className="voucherCreateSummaryItem">
            <span>{t("opsAdmin.startDate")}</span>
            <strong>{formatDateLabel(form.startDate)}</strong>
          </div>
          <div className="voucherCreateSummaryItem">
            <span>{t("opsAdmin.endDate")}</span>
            <strong>{formatDateLabel(form.endDate)}</strong>
          </div>
        </aside>
      </form>
    </section>
  );
};

export default VoucherCreate;
