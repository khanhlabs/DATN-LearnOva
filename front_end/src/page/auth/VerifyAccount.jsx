import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const VerifyAccount = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        if (!token) {
            toast.error("Mã xác thực không tồn tại hoặc không hợp lệ!");
            navigate("/learnova/auth/auth"); // Đá về trang auth của bạn
            return;
        }

        const apiUrl = (import.meta.env.VITE_API_URL || "/api/learnova").replace(/\/+$/, "");
        axios.get(`${apiUrl}/auth/verify?token=${encodeURIComponent(token)}`)
            .then((res) => {
                toast.success(res.data?.message || "Kích hoạt tài khoản thành công!");

                // ĐIỀU HƯỚNG CHUẨN: Chuyển thẳng về trang Login hệ thống của bạn
                navigate("/learnova/auth/auth");
            })
            .catch((err) => {
                const errorMsg = err.response?.data?.message || "Kích hoạt thất bại hoặc link đã hết hạn!";
                toast.error(errorMsg);
                navigate("/learnova/auth/auth");
            });
    }, [navigate]);

    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            fontFamily: "Arial, sans-serif",
            backgroundColor: "#f4f4f4"
        }}>
            <div style={{ textAlign: "center" }}>
                <div className="spinner" style={{ margin: "0 auto 20px" }}></div>
                <h2 style={{ color: "#2563eb", fontSize: "1.5rem", fontWeight: "600" }}>
                    Đang xác thực và chuyển hướng về trang đăng nhập...
                </h2>
            </div>
        </div>
    );
};

export default VerifyAccount;
