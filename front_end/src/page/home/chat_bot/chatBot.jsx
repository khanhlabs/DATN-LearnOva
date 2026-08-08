
import "./chatBot.css";
import { FaPaperPlane } from "react-icons/fa";
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import chatBot from "../../../assets/image/ChatBot.png";
import { useState, useEffect, useRef } from "react";
import { streamChatMessageApi } from "../../../api/chatbot/ChatApi.js";

const CHAT_HISTORY_STORAGE_KEY = "learnova_chat_history";
const SUPPORT_HOTLINE = "0867884965";

const DEFAULT_MESSAGES = [
    {
        sender: "bot",
        text: "Xin chào 👋 Mình là trợ lý chat_bot của Learnova."
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
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [showGreeting, setShowGreeting] = useState(true);

    const [greetingText, setGreetingText] = useState(
        "👋 Xin chào! Mình là Learnova AI"
    );

    const [message, setMessage] = useState("");
    const messagesEndRef = useRef(null);

    const [messages, setMessages] = useState(() =>
        loadStoredMessages().map((msg, index) => ({ ...msg, id: msg.id ?? index }))
    );
    const nextIdRef = useRef(messages.length);

    const [isSending, setIsSending] = useState(false);
    // Chỉ hiện "Đang trả lời..." trước khi token đầu tiên của stream về tới —
    // sau đó nội dung đang chạy chữ dần đã đủ báo hiệu bot đang trả lời.
    const [hasReceivedFirstChunk, setHasReceivedFirstChunk] = useState(false);

    // Trạng thái phản hồi (👍/👎) và khối FAQ/hotline đi kèm mỗi tin nhắn bot —
    // chỉ tồn tại trong phiên hiện tại, không cần lưu localStorage.
    const [feedbackByMessageId, setFeedbackByMessageId] = useState({});
    const [openFaqIndexByMessageId, setOpenFaqIndexByMessageId] = useState({});
    const [showHotlineByMessageId, setShowHotlineByMessageId] = useState({});

    const supportFaqQuestions = t("chatbot.supportFaq.questions", { returnObjects: true });

    const handleLike = (id) => {
        setFeedbackByMessageId((prev) => ({ ...prev, [id]: "like" }));
    };

    const handleDislike = (id) => {
        setFeedbackByMessageId((prev) => ({ ...prev, [id]: "dislike" }));
    };

    const toggleFaqItem = (messageId, index) => {
        setOpenFaqIndexByMessageId((prev) => ({
            ...prev,
            [messageId]: prev[messageId] === index ? null : index,
        }));
    };

    const handleShowHotline = (id) => {
        setShowHotlineByMessageId((prev) => ({ ...prev, [id]: true }));
    };

    // Chỉ xóa lịch sử chat khi người dùng bấm nút Đăng xuất thật sự
    // (sự kiện "learnova:logout" do AuthContext phát ra) — không dựa vào
    // trạng thái isAuthenticated vì nó có thể trập trờn lúc trang khôi phục
    // phiên đăng nhập, dễ gây xóa nhầm chat của người đang đăng nhập.
    useEffect(() => {
        const handleLogout = () => {
            const reset = DEFAULT_MESSAGES.map((msg, index) => ({ ...msg, id: index }));
            setMessages(reset);
            persistMessages(reset);
            nextIdRef.current = reset.length;
            setFeedbackByMessageId({});
            setOpenFaqIndexByMessageId({});
            setShowHotlineByMessageId({});
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

        const userMessage = { sender: "user", text: message, id: nextIdRef.current++ };
        const nextMessages = [...messages, userMessage];

        setMessages(nextMessages);
        persistMessages(nextMessages);
        setMessage("");
        setIsSending(true);
        setHasReceivedFirstChunk(false);

        const payload = nextMessages.map((msg) => ({
            role: msg.sender === "bot" ? "model" : "user",
            text: msg.text,
        }));

        const botMessageId = nextIdRef.current++;
        let accumulatedText = "";
        let botMessageStarted = false;

        // Ghi vào localStorage ngay tại mỗi bước (không qua effect) để tin nhắn
        // không bị mất nếu widget bị unmount do người dùng chuyển trang giữa chừng.
        const upsertBotMessage = (text) => {
            setMessages((prev) => {
                const updated = botMessageStarted
                    ? prev.map((m) => (m.id === botMessageId ? { ...m, text } : m))
                    : [...prev, { sender: "bot", text, id: botMessageId }];

                botMessageStarted = true;
                persistMessages(updated);
                return updated;
            });
        };

        try {
            await streamChatMessageApi(payload, {
                onChunk: (chunkText) => {
                    accumulatedText += chunkText;
                    upsertBotMessage(accumulatedText);
                    setHasReceivedFirstChunk(true);
                },
                onError: (errorMessage) => {
                    upsertBotMessage(errorMessage || "Xin lỗi, mình đang gặp sự cố kết nối. Bạn thử lại sau nhé.");
                },
            });

            if (!botMessageStarted) {
                upsertBotMessage("Xin lỗi, mình đang gặp sự cố kết nối. Bạn thử lại sau nhé.");
            }
        } catch {
            if (!botMessageStarted) {
                upsertBotMessage("Xin lỗi, mình đang gặp sự cố kết nối. Bạn thử lại sau nhé.");
            }
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
                            {messages.map((msg) => (
                                <div key={msg.id} className="message-block">
                                    <div className={`message ${msg.sender}`}>
                                        {msg.text}
                                    </div>

                                    {msg.sender === "bot" && (
                                        <div className="message-feedback">
                                            <button
                                                type="button"
                                                className={`feedback-btn ${feedbackByMessageId[msg.id] === "like" ? "active" : ""}`}
                                                aria-label="Like"
                                                onClick={() => handleLike(msg.id)}
                                            >
                                                <ThumbsUp size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                className={`feedback-btn ${feedbackByMessageId[msg.id] === "dislike" ? "active" : ""}`}
                                                aria-label="Dislike"
                                                onClick={() => handleDislike(msg.id)}
                                            >
                                                <ThumbsDown size={13} />
                                            </button>
                                        </div>
                                    )}

                                    {msg.sender === "bot" && feedbackByMessageId[msg.id] === "dislike" && (
                                        <div className="support-box">
                                            <p className="support-box-title">{t("chatbot.issuePrompt")}</p>

                                            <div className="support-faq-list">
                                                {supportFaqQuestions.map((item, index) => {
                                                    const isOpen = openFaqIndexByMessageId[msg.id] === index;

                                                    return (
                                                        <div key={index} className="support-faq-item">
                                                            <button
                                                                type="button"
                                                                className="support-faq-question"
                                                                onClick={() => toggleFaqItem(msg.id, index)}
                                                            >
                                                                <span>{item.q}</span>
                                                                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                            </button>

                                                            {isOpen && (
                                                                <p className="support-faq-answer">{item.a}</p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {!showHotlineByMessageId[msg.id] ? (
                                                <button
                                                    type="button"
                                                    className="support-hotline-trigger"
                                                    onClick={() => handleShowHotline(msg.id)}
                                                >
                                                    {t("chatbot.stillNeedHelp")}
                                                </button>
                                            ) : (
                                                <div className="support-hotline-box">
                                                    <Phone size={14} />
                                                    <span>{t("chatbot.hotlineIntro")}</span>
                                                    <a href={`tel:${SUPPORT_HOTLINE}`}>{SUPPORT_HOTLINE}</a>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isSending && !hasReceivedFirstChunk && (
                                <div className="message bot typing-indicator">
                                    Đang trả lời...
                                </div>
                            )}

                            <div ref={messagesEndRef}></div>
                        </div>
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