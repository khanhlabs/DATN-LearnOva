import { useEffect, useState } from "react";
import {
  FiTag,
  FiShield,
  FiClock,
  FiShoppingBag,
  FiPercent,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { getAdminVoucherOverviewApi } from "../../../../api/admin/VoucherApi.js";
import { useAxiosPrivate } from "../../../../hook/UseAxiosPrivate.js";
import "./VoucherCards.css";
import TotalVoucherCard from "./total_voucher_card/TotalVoucherCard.jsx";
import ActivatedVoucherCard from "./activated_voucher_card/ActivatedVoucherCard.jsx";
import ExpiredVoucherCard from "./expired_voucher_card/ExpiredVoucherCard.jsx";
import AppliedVoucherCard from "./applied_voucher_card/AppliedVoucherCard.jsx";
import ReducedAmountVoucherCard from "./reduced_amount_voucher_card/ReducedAmountVoucherCard.jsx";
import ConversionRateVoucherCard from "./conversation_rate_voucher_card/ConversionRateVoucherCard.jsx";

const cardComponents = {
  total: TotalVoucherCard,
  activated: ActivatedVoucherCard,
  expired: ExpiredVoucherCard,
  applied: AppliedVoucherCard,
  conversion: ConversionRateVoucherCard,
};

const formatCount = (value) => Number(value || 0).toLocaleString("en-US");

const formatPercent = (value) => {
  if (value == null || Number.isNaN(Number(value))) {
    return "—";
  }
  return `${Number(value).toFixed(1)}%`;
};

const formatDelta = (value) => {
  if (value == null || Number.isNaN(Number(value))) {
    return null;
  }
  const numeric = Number(value);
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${numeric.toFixed(1)}%`;
};

const VoucherCards = ({ refreshKey = 0 }) => {
  const { t } = useTranslation();
  const axiosPrivate = useAxiosPrivate();
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await getAdminVoucherOverviewApi(axiosPrivate);
        if (!mounted) return;
        setOverview(data);
        setError("");
      } catch (err) {
        if (!mounted) return;
        setOverview(null);
        setError(err?.response?.data?.message || "Unable to load voucher overview.");
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [axiosPrivate, refreshKey]);

  const totalDelta = formatDelta(overview?.totalVouchersDeltaPercent);

  const cards = [
    {
      id: "total",
      title: t("opsAdmin.totalVouchers"),
      value: formatCount(overview?.totalVouchers),
      note: totalDelta
        ? `${totalDelta} ${t("opsAdmin.lastMonth")}`
        : t("opsAdmin.lastMonth"),
      icon: FiTag,
      accent: "gold",
    },
    {
      id: "activated",
      title: t("opsAdmin.activated"),
      value: formatCount(overview?.activeVouchers),
      note: t("opsAdmin.currentlyActive"),
      icon: FiShield,
      accent: "green",
    },
    {
      id: "expired",
      title: t("opsAdmin.expired"),
      value: formatCount(overview?.expiredVouchers),
      note: t("opsAdmin.noLongerValid"),
      icon: FiClock,
      accent: "red",
    },
    {
      id: "applied",
      title: t("opsAdmin.applied"),
      value: formatCount(overview?.appliedUses),
      note: t("opsAdmin.couponUsage"),
      icon: FiShoppingBag,
      accent: "blue",
    },
    {
      id: "conversion",
      title: t("opsAdmin.conversion"),
      value: formatPercent(overview?.conversionRatePercent),
      note: t("opsAdmin.couponPerformance"),
      icon: FiPercent,
      accent: "orange",
    },
  ];

  return (
    <>
      {error ? <p className="voucherCardsError">{error}</p> : null}
      <div className="voucherCardsRow">
        {cards.map((card) => {
          const Card = cardComponents[card.id];
          return <Card key={card.id} {...card} />;
        })}
      </div>
    </>
  );
};

export default VoucherCards;
