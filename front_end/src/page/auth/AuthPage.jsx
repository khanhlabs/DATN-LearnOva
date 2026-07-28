import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, Loader2 } from "lucide-react"; // Import thêm icon đẹp từ lucide
import axios from "axios";
import { toast } from "react-toastify";
import AuthBanner from "./components/AuthBanner.jsx";
import LoginForm from "./components/LoginForm.jsx";
import RegisterForm from "./components/RegisterForm.jsx";
import "./AuthPage.css";

const AuthPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const authMode = searchParams.get("mode") === "register" ? "register" : "login";
    const isRegisterMode = authMode === "register";
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState("processing"); // processing, success, error
    const [verifyMessage, setVerifyMessage] = useState("Hệ thống đang tiến hành kích hoạt tài khoản của bạn...");

    const hasFetched = useRef(false);

    useEffect(() => {
        const token = searchParams.get("token");
        if (token && !hasFetched.current) {
            hasFetched.current = true;
            setIsVerifying(true);
            setVerifyStatus("processing");
            axios.get(`http://localhost:5173/api/learnova/auth/verify?token=${token}`)
                .then((res) => {
                    setVerifyStatus("success");
                    setVerifyMessage(res.data?.message || "Tài khoản của bạn đã được kích hoạt thành công. Hãy bắt đầu trải nghiệm học tập ngay!");
                    toast.success("Kích hoạt tài khoản thành công!");
                    setTimeout(() => {
                        setIsVerifying(false);
                        setSearchParams({ mode: "login" });
                    }, 3000);
                })
                .catch((err) => {
                    setVerifyStatus("error");
                    const errorMsg = err.response?.data?.message || "Đường link xác thực đã hết hạn hoặc không tồn tại trên hệ thống!";
                    setVerifyMessage(errorMsg);
                    toast.error(errorMsg);
                });
        }
    }, [searchParams, setSearchParams]);

    const switchToRegister = () => {
        setSearchParams({mode: "register"});
    }

    const switchToLogin = () => {
        setSearchParams({mode: "login"});
    }

    return (
        <div className={`auth-page ${isRegisterMode ? "register-mode" : ""}`} style={{ position: "relative" }}>
            <Link to="/" className="auth-back-home">
                <ArrowLeft size={20}/>
                <span>Back to home</span>
            </Link>

            <div className="auth-form-panel login-panel">
                <LoginForm onSwitchToRegister={switchToRegister} />
            </div>

            <div className="auth-form-panel register-panel">
                <RegisterForm onSwitchToLogin={switchToLogin} />
            </div>

            <div className="auth-banner-panel">
                <AuthBanner mode={authMode} />
            </div>
            {isVerifying && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.7)",
                    backdropFilter: "blur(6px)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 9999,
                    animation: "fadeIn 0.3s ease-out"
                }}>
                    <div style={{
                        background: "#ffffff",
                        padding: "40px 30px",
                        borderRadius: "20px",
                        textAlign: "center",
                        maxWidth: "440px",
                        width: "90%",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center"
                    }}>

                        {/* Khu vực hiển thị ICON động tương ứng với trạng thái */}
                        <div style={{ marginBottom: "24px" }}>
                            {verifyStatus === "processing" && (
                                <Loader2 size={64} color="#2563eb" style={{ animation: "spin 1s linear infinite" }} />
                            )}
                            {verifyStatus === "success" && (
                                <CheckCircle2 size={68} color="#10b981" style={{ animation: "scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }} />
                            )}
                            {verifyStatus === "error" && (
                                <XCircle size={68} color="#ef4444" style={{ animation: "scaleUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }} />
                            )}
                        </div>

                        {/* Tiêu đề Modal */}
                        <h3 style={{
                            fontSize: "1.5rem",
                            fontWeight: "700",
                            letterSpacing: "-0.025em",
                            color: verifyStatus === "success" ? "#10b981" : verifyStatus === "error" ? "#ef4444" : "#1e293b",
                            margin: "0 0 10px 0"
                        }}>
                            {verifyStatus === "success" && "Xác Thực Thành Công!"}
                            {verifyStatus === "error" && "Kích Hoạt Thất Bại"}
                            {verifyStatus === "processing" && "Đang Xác Thực Tài Khoản"}
                        </h3>

                        {/* Nội dung thông báo phụ */}
                        <p style={{
                            fontSize: "0.975rem",
                            color: "#64748b",
                            lineHeight: "1.6",
                            margin: "0 0 10px 0",
                            fontWeight: "400"
                        }}>
                            {verifyMessage}
                        </p>

                        {/* Hiệu ứng loading nhỏ khi đang chuyển hướng thành công */}
                        {verifyStatus === "success" && (
                            <p style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic", marginTop: "10px" }}>
                                Đang tự động chuyển hướng về trang đăng nhập...
                            </p>
                        )}

                        {/* Nút đóng phong cách Tailwind cho trường hợp dính lỗi */}
                        {verifyStatus === "error" && (
                            <button
                                onClick={() => {
                                    setIsVerifying(false);
                                    setSearchParams({ mode: "login" });
                                }}
                                style={{
                                    marginTop: "24px",
                                    background: "#ef4444",
                                    color: "white",
                                    border: "none",
                                    padding: "12px 32px",
                                    fontSize: "0.95rem",
                                    fontWeight: "600",
                                    borderRadius: "10px",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.4)",
                                    transition: "all 0.2s",
                                }}
                                onMouseOver={(e) => e.target.style.background = "#dc2626"}
                                onMouseOut={(e) => e.target.style.background = "#ef4444"}
                            >
                                Đóng và Quay lại
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AuthPage;