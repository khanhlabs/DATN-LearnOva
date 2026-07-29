import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getPaymentStatusApi } from "../../../api/PaymentApi.js";
import { useAuth } from "../../../hook/UseAuth.jsx";
import { useAxiosPrivate } from "../../../hook/UseAxiosPrivate.js";
import "./PaymentSuccess.css";

const PaymentSuccess = () => {
  const axiosPrivate = useAxiosPrivate();
  const { accessToken, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [syncState, setSyncState] = useState("syncing");
  const [message, setMessage] = useState("Confirming payment with payOS…");
  const orderCode = searchParams.get("orderCode") || searchParams.get("orderId");

  useEffect(() => {
    if (authLoading) return undefined;

    if (!orderCode) {
      setSyncState("warning");
      setMessage("No order id in the return URL. Open My Courses in a few seconds — webhook/poll may still unlock the course.");
      return undefined;
    }

    let mounted = true;
    let attempts = 0;

    const sync = async () => {
      attempts += 1;
      try {
        const status = await getPaymentStatusApi(axiosPrivate, orderCode, accessToken);
        if (!mounted) return true;

        const isPaid = status?.orderStatus === "PAID" || status?.paymentStatus === "SUCCESS";
        if (isPaid) {
          setSyncState("success");
          setMessage("Payment confirmed. Your courses are unlocked.");
          return true;
        }

        if (attempts >= 5) {
          setSyncState("warning");
          setMessage("payOS redirected here, but LearnOva has not confirmed payment yet. Keep this tab open or check My Courses shortly.");
          return true;
        }

        setMessage(`Still confirming payment… (try ${attempts}/5)`);
        return false;
      } catch (err) {
        if (!mounted) return true;
        if (attempts >= 5) {
          setSyncState("error");
          setMessage(err?.response?.data?.message || "Could not confirm payment. Try My Courses in a moment.");
          return true;
        }
        return false;
      }
    };

    let timer;
    const run = async () => {
      const done = await sync();
      if (!done && mounted) {
        timer = window.setTimeout(run, 2000);
      }
    };
    run();

    return () => {
      mounted = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [accessToken, authLoading, axiosPrivate, orderCode]);

  return (
    <div className="payment-success-page">
      <div className="payment-success-panel">
        <h1>Returning from payOS</h1>
        <p>{message}</p>
        {syncState === "syncing" ? <p>Please wait a moment.</p> : null}
        <Link to="/learnova/user/profile/courses">My courses</Link>
      </div>
    </div>
  );
};

export default PaymentSuccess;
