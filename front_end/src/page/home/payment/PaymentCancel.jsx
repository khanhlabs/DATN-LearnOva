import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { cancelPaymentApi, getPaymentStatusApi } from "../../../api/PaymentApi.js";
import { useAuth } from "../../../hook/UseAuth.jsx";
import { useAxiosPrivate } from "../../../hook/UseAxiosPrivate.js";
import "./PaymentSuccess.css";

/**
 * PayOS cancelUrl lands here when the student clicks Cancel on payOS.
 * Cart items are NOT removed — only the pending PayOS order is closed.
 */
const PaymentCancel = () => {
  const axiosPrivate = useAxiosPrivate();
  const { accessToken, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Closing this payment attempt…");
  const orderCode = searchParams.get("orderCode") || searchParams.get("orderId");

  useEffect(() => {
    if (authLoading) return undefined;

    if (!orderCode) {
      setMessage(
        "Payment skipped. Your courses are still in the cart — you can pay later anytime.",
      );
      return undefined;
    }

    if (!accessToken) {
      setMessage(
        "Payment skipped. Sign in, then open your cart — the courses are still there to pay later.",
      );
      return undefined;
    }

    let mounted = true;

    // Close pending PayOS order only. Does not touch the shopping cart.
    cancelPaymentApi(axiosPrivate, orderCode, accessToken)
      .catch(() => getPaymentStatusApi(axiosPrivate, orderCode, accessToken))
      .then((status) => {
        if (!mounted) return;
        if (status?.orderStatus === "PAID" || status?.paymentStatus === "SUCCESS") {
          setMessage("This order was actually paid. Open My Courses to start learning.");
          return;
        }
        setMessage(
          "Payment skipped. Your courses are still in the cart — checkout again when you are ready.",
        );
      })
      .catch(() => {
        if (!mounted) return;
        setMessage(
          "Payment skipped. Your courses should still be in the cart — open the cart to pay later.",
        );
      });

    return () => {
      mounted = false;
    };
  }, [accessToken, authLoading, axiosPrivate, orderCode]);

  return (
    <div className="payment-success-page">
      <div className="payment-success-panel">
        <h1>Payment skipped</h1>
        <p>{message}</p>
        <Link to="/learnova/cart">Back to cart</Link>
      </div>
    </div>
  );
};

export default PaymentCancel;
