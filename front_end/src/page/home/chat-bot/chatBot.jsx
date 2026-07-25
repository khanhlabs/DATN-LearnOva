
import "./chatBot.css";
import { FaPaperPlane } from "react-icons/fa";
import chatBot from "../../../assets/chatbot.png";
import { useState, useEffect, useRef } from "react";
import { sendChatMessageApi } from "../../../api/ChatApi.js";

const CHAT_HISTORY_STORAGE_KEY = "learnova_chat_history";

const DEFAULT_MESSAGES = [
    {
        sender: "bot",
        text: "Xin chào 👋 Mình là trợ lý chat-bot của Learnova."
    }
];

const loadStoredMessages = () => {
    try {
        const raw = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
        if (!raw) return DEFAULT_MESSAGES;

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MESSAGES;
    } catch {
        return DEFAULT_MESSAGES;
    }
};

const persistMessages = (nextMessages) => {
    try {
        localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(nextMessages));
    } catch {
        // localStorage đầy hoặc bị chặn — bỏ qua, không ảnh hưởng chat
    }
};

function LearnovaAI() {
    const [isOpen, setIsOpen] = useState(false);
    const [showGreeting, setShowGreeting] = useState(true);

    const [greetingText, setGreetingText] = useState(
        "👋 Xin chào! Mình là Learnova AI"
    );

    const [message, setMessage] = useState("");
    const messagesEndRef = useRef(null);

    const [messages, setMessages] = useState(loadStoredMessages);

    const [isSending, setIsSending] = useState(false);

    // Chỉ xóa lịch sử chat khi người dùng bấm nút Đăng xuất thật sự
    // (sự kiện "learnova:logout" do AuthContext phát ra) — không dựa vào
    // trạng thái isAuthenticated vì nó có thể trập trờn lúc trang khôi phục
    // phiên đăng nhập, dễ gây xóa nhầm chat của người đang đăng nhập.
    useEffect(() => {
        const handleLogout = () => {
            setMessages(DEFAULT_MESSAGES);
            persistMessages(DEFAULT_MESSAGES);
        };

        window.addEventListener("learnova:logout", handleLogout);
        return () => window.removeEventListener("learnova:logout", handleLogout);
    }, []);

// Lời chào ban đầu tự ẩn sau 7 giây
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowGreeting(false);
        }, 7000);

        return () => clearTimeout(timer);
    }, []);

// Nhắc người dùng khi không tương tác
    useEffect(() => {
        let idleTimer;
        let hideTimer;

        const startTimer = () => {
            clearTimeout(idleTimer);
            clearTimeout(hideTimer);

            idleTimer = setTimeout(() => {

                setGreetingText(
                    "👋 Bạn cần mình hỗ trợ gì không nè?"
                );

                setShowGreeting(true);

                hideTimer = setTimeout(() => {
                    setShowGreeting(false);

                    // Sau khi tắt thì đếm tiếp
                    startTimer();

                }, 7000);

            }, 300000); // TEST 10 GIÂY
            // Deploy đổi thành 300000
        };

        const handleActivity = () => {
            clearTimeout(idleTimer);
            clearTimeout(hideTimer);

            setShowGreeting(false);

            startTimer();
        };

        startTimer();

        window.addEventListener("click", handleActivity);
        window.addEventListener("keydown", handleActivity);

        return () => {
            clearTimeout(idleTimer);
            clearTimeout(hideTimer);

            window.removeEventListener("click", handleActivity);
            window.removeEventListener("keydown", handleActivity);
        };
    }, []);

// Auto scroll chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages]);

    const handleSend = async () => {
        if (!message.trim() || isSending) return;

        const userMessage = { sender: "user", text: message };
        const nextMessages = [...messages, userMessage];

        setMessages(nextMessages);
        persistMessages(nextMessages);
        setMessage("");
        setIsSending(true);

        try {
            const payload = nextMessages.map((msg) => ({
                role: msg.sender === "bot" ? "model" : "user",
                text: msg.text,
            }));

            const { reply } = await sendChatMessageApi(payload);
            const withReply = [...nextMessages, { sender: "bot", text: reply }];

            // Ghi vào localStorage ngay tại đây (không qua effect) để tin nhắn
            // không bị mất nếu widget đã bị unmount do người dùng chuyển trang
            // trong lúc chờ AI trả lời.
            persistMessages(withReply);
            setMessages(withReply);
        } catch (err) {
            const errorText =
                err?.response?.data?.message ||
                "Xin lỗi, mình đang gặp sự cố kết nối. Bạn thử lại sau nhé.";

            const withError = [...nextMessages, { sender: "bot", text: errorText }];

            persistMessages(withError);
            setMessages(withError);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="ai-widget">

            {/* Chat Window */}
            {isOpen && (
                <div className="chat-container">

                    {/* Header */}
                    <div className="chat-header">
                        <div className="header-left-AI">
                            <div className="avatar-ai">
                                <img src={chatBot} alt="Learnova AI" />
                            </div>

                            <div>
                                <h3>Learnova AI</h3>

                                <span className="status">
                                    <span className="dot"></span>
                                    Online
                                </span>
                            </div>
                        </div>

                        <button
                            className="minimize-btn"
                            onClick={() => setIsOpen(false)}
                        >
                            −
                        </button>
                    </div>

                    {/* Body */}
                    <div className="chat-body">
                        <div className="messages">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`message ${msg.sender}`}
                                >
                                    {msg.text}
                                </div>
                            ))}

                            {isSending && (
                                <div className="message bot typing-indicator">
                                    Đang trả lời...
                                </div>
                            )}

                            <div ref={messagesEndRef}></div>
                        </div>

                        {/*<div className="suggestions">*/}
                        {/*    {suggestions.map((item, index) => (*/}
                        {/*        <button*/}
                        {/*            key={index}*/}
                        {/*            className="suggestion-btn"*/}
                        {/*        >*/}
                        {/*            {item}*/}
                        {/*        </button>*/}
                        {/*    ))}*/}
                        {/*</div>*/}
                    </div>

                    {/* Footer */}
                    <div className="chat-footer">
                        <div className="input-wrapper">
                            <input
                                type="text"
                                placeholder="Nhập câu hỏi của bạn..."
                                value={message}
                                disabled={isSending}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleSend();
                                    }
                                }}
                            />

                            <button
                                className="send-btn"
                                onClick={handleSend}
                                disabled={isSending}
                            >
                                <FaPaperPlane />
                            </button>
                        </div>

                        <p className="powered">
                            Powered by <span>Learnova AI</span>
                        </p>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <div className="ai-widget">

                {showGreeting && !isOpen && (
                    <div className="ai-greeting">
                        {greetingText}
                    </div>
                )}

                <button
                    className="floating-bot"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <img
                        src={chatBot}
                        alt="Learnova AI"
                    />
                </button>

            </div>
        </div>
    );
}

export default LearnovaAI;