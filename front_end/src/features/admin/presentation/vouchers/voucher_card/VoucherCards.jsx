import { useEffect, useState } from "react";
import {
  FiTag,
  FiShield,
  FiClock,
  FiShoppingBag,
  FiDollarSign,
  FiPercent,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import "./VoucherCards.css";
import TotalVoucherCard from "./total_voucher_card/TotalVoucherCard";
import ActivatedVoucherCard from "./activated_voucher_card/ActivatedVoucherCard";
import ExpiredVoucherCard from "./expired_voucher_card/ExpiredVoucherCard";
import AppliedVoucherCard from "./applied_voucher_card/AppliedVoucherCard";
import ReducedAmountVoucherCard from "./reduced_amount_voucher_card/ReducedAmountVoucherCard";
import ConversionRateVoucherCard from "./conversation_rate_voucher_card/ConversionRateVoucherCard";
import { getAdminVoucherOverviewApi } from "../../../infrastructure/api/VoucherApi";
import { useAxiosPrivate } from "../../../../../shared/hooks/useAxiosPrivate";

const cardComponents = {
  total: TotalVoucherCard,
  activated: ActivatedVoucherCard,
  expired: ExpiredVoucherCard,
  applied: AppliedVoucherCard,
  reduced: ReducedAmountVoucherCard,
  conversion: ConversionRateVoucherCard,
};

const formatCount = (value) => Number(value || 0).toLocaleString("en-US");

const formatMoney = (value) => {
  const amount = Number(value || 0);
  const fractionDigits = Number.isInteger(amount) ? 0 : 1;
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  })}`;
};

const formatPercent = (value) => {
  if (value == null || Number.isNaN(Number(value))) {
    return "—";
  }
  return `${Number(value).toFixed(1)}%`;
};

const formatDeltaNote = (delta, baseNote) => {
  if (delta == null || Number.isNaN(Number(delta))) {
    return baseNote;
  }
  const numeric = Number(delta);
  const sign = numeric > 0 ? "+" : "";
  return `${sign}${numeric.toFixed(1)}% ${baseNote}`;
};

const VoucherCards = ({ refreshKey = 0 }) => {
  const { t } = useTranslation();
  const axiosPrivate = useAxiosPrivate();
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await getAdminVoucherOverviewApi(axiosPrivate);
        if (!mounted) return;
        setOverview(data);
      } catch {
        if (!mounted) return;
        setOverview(null);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [axiosPrivate, refreshKey]);

  const cards = [
    {
      id: "total",
      title: t("opsAdmin.totalVouchers"),
      value: formatCount(overview?.totalVouchers),
      note: formatDeltaNote(
        overview?.totalVouchersDeltaPercent,
        t("opsAdmin.lastMonth")
      ),
      icon: FiTag,
      accent: "accentGold",
    },
    {
      id: "activated",
      title: t("opsAdmin.activated"),
      value: formatCount(overview?.activeVouchers),
      note: t("opsAdmin.currentlyActive"),
      icon: FiShield,
      accent: "accentGreen",
    },
    {
      id: "expired",
      title: t("opsAdmin.expired"),
      value: formatCount(overview?.expiredVouchers),
      note: t("opsAdmin.noLongerValid"),
      icon: FiClock,
      accent: "accentRed",
    },
    {
      id: "applied",
      title: t("opsAdmin.applied"),
      value: formatCount(overview?.appliedUses),
      note: t("opsAdmin.couponUsage"),
      icon: FiShoppingBag,
      accent: "accentBlue",
    },
    {
      id: "reduced",
      title: t("opsAdmin.discounted"),
      value: formatMoney(overview?.totalDiscountedAmount),
      note: t("opsAdmin.monthlyDiscount"),
      icon: FiDollarSign,
      accent: "accentPurple",
    },
    {
      id: "conversion",
      title: t("opsAdmin.conversion"),
      value: formatPercent(overview?.conversionRatePercent),
      note: t("opsAdmin.couponPerformance"),
      icon: FiPercent,
      accent: "accentOrange",
    },
  ];

  return (
    <div className="voucherCardsRow">
      {cards.map((card) => {
        const Card = cardComponents[card.id];
        return <Card key={card.id} {...card} />;
      })}
    </div>
  );
};

export default VoucherCards;
