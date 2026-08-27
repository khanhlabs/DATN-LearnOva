import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  downloadPaymentReceiptApi,
  getPaymentHistoryDetailApi,
} from "../../../../profile/infrastructure/api/PaymentHistoryApi";
import PaymentReceiptModal from "../../../../profile/presentation/profileView/sections/PaymentReceiptModal";
import { useAuth } from "../../../../../shared/hooks/useAuth";
import { useAxiosPrivate } from "../../../../../shared/hooks/useAxiosPrivate";
import { getTeacherEarnings } from "../../../infrastructure/api/teacher/EarningsApi";
import EarningsTable from "./components/EarningsTable";
import "./EarningsPage.css";

const EarningsPage = () => {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedDisplayCode, setSelectedDisplayCode] = useState("");
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let mounted = true;

    getTeacherEarnings()
      .then((data) => {
        if (!mounted) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (!mounted) return;
        setItems([]);
        toast.error("Failed to load earnings.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const closeReceipt = () => {
    setSelectedPayment(null);
    setSelectedDisplayCode("");
  };

  const handleView = async (item) => {
    if (!item?.orderId) return;
    setIsLoadingDetail(true);
    setSelectedPayment(null);
    setSelectedDisplayCode(item.transactionId || `PAY-${item.paymentId}`);
    try {
      setSelectedPayment(
        await getPaymentHistoryDetailApi(axiosPrivate, item.orderId, accessToken)
      );
    } catch (requestError) {
      setSelectedDisplayCode("");
      toast.error(
        requestError?.response?.data?.message || t("profile.paymentHistory.detailError")
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (
      !selectedPayment ||
      selectedPayment.orderStatus !== "PAID" ||
      selectedPayment.paymentStatus !== "SUCCESS"
    ) {
      return;
    }
    setIsDownloading(true);
    try {
      const blob = await downloadPaymentReceiptApi(
        axiosPrivate,
        selectedPayment.orderId,
        accessToken
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `learnova-payment-receipt-${selectedPayment.orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(t("profile.paymentHistory.downloadSuccess"));
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message || t("profile.paymentHistory.downloadError")
      );
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="teacher-page teacher-earnings-page">
        <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
          Loading earnings...
        </div>
      </section>
    );
  }

  return (
    <section className="teacher-page teacher-earnings-page">
      <div>
        <h2 className="teacher-earnings-page__title">Course earnings</h2>
        <p className="teacher-earnings-page__subtitle">
          Successful course sales for your account (platform fee 20%, net 80%).
        </p>
      </div>

      <EarningsTable items={items} onView={handleView} />

      {(isLoadingDetail || selectedPayment) && (
        <PaymentReceiptModal
          payment={selectedPayment}
          isLoading={isLoadingDetail}
          isDownloading={isDownloading}
          displayCode={selectedDisplayCode}
          showStudent
          onClose={closeReceipt}
          onDownload={handleDownloadReceipt}
        />
      )}
    </section>
  );
};

export default EarningsPage;
