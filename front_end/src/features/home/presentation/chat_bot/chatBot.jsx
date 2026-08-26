import "./chatBot.css";
import { FaPaperPlane } from "react-icons/fa";
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Phone, MessageCircle, ArrowLeft, Paperclip, X, UserRound, Headphones } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import chatBot from "../../../../assets/image/ChatBot.png";
import { useState, useEffect, useRef } from "react";
import { streamChatMessageApi } from "../../../chatbot/infrastructure/api/ChatApi";
import { createSupportConversationApi, getMySupportConversationsApi, getSupportMessagesApi, sendSupportMessageApi } from "../../../support/infrastructure/api/SupportApi";
import { generateUploadUrl } from "../../../../shared/api/upload/UploadApi";
import { uploadFileToS3 } from "../../../../shared/services/UploadService";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { useSupportRealtime } from "../../../../shared/hooks/useSupportRealtime";
import { markSupportConversationReadApi } from "../../../notification/infrastructure/api/NotificationApi";

const CHAT_HISTORY_STORAGE_KEY = "learnova_chat_history";
const SUPPORT_HOTLINE = "0867884965";
const SUPPORT_EMAIL = "nguyenphithong167@gmail.com";

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

const renderChatText = (value) => {
    const normalized = String(value || "")
        .replace(/<br\s*\/?\s*>/gi, "\n")
        .replace(/\s*\|\s*/g, "\n");
    const lines = normalized
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line, index, all) => line || (index > 0 && all[index - 1]));

    const courseFields = ["Khóa học", "Giảng viên", "Danh mục", "Giá"];
    const headerIndex = lines.findIndex((line, index) =>
        courseFields.every((field, fieldIndex) => lines[index + fieldIndex] === field),
    );

    const renderInline = (line, key) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
            <span key={key}>
                {parts.map((part, partIndex) => (
                    part.startsWith("**") && part.endsWith("**")
                        ? <strong key={partIndex}>{part.slice(2, -2)}</strong>
                        : <span key={partIndex}>{part}</span>
                ))}
            </span>
        );
    };

    if (headerIndex >= 0) {
        const introLines = lines.slice(0, headerIndex);
        const values = lines
            .slice(headerIndex + courseFields.length)
            .filter((line) => !/^[-–—_]{2,}$/.test(line));
        const courses = [];
        for (let index = 0; index + courseFields.length - 1 < values.length; index += courseFields.length) {
            const course = values.slice(index, index + courseFields.length);
            if (course.length === courseFields.length) courses.push(course);
        }

        return (
            <>
                {introLines.map((line, index) => (
                    <span key={`intro-${index}`} className="chat-text-line">
                        {renderInline(line, `intro-content-${index}`)}
                    </span>
                ))}
                {courses.length > 0 && (
                    <span className="chat-course-list">
                        {courses.map((course, courseIndex) => (
                            <span className="chat-course-card" key={`course-${courseIndex}`}>
                                <strong className="chat-course-title">{course[0]}</strong>
                                <span><b>Giảng viên:</b> {course[1]}</span>
                                <span><b>Danh mục:</b> {course[2]}</span>
                                <span className="chat-course-price"><b>Giá:</b> {course[3]}</span>
                            </span>
                        ))}
                    </span>
                )}
            </>
        );
    }

    return lines.map((line, lineIndex) => {
        return (
            <span key={`line-${lineIndex}`} className="chat-text-line">
                {renderInline(line, `line-content-${lineIndex}`)}
                {lineIndex < lines.length - 1 && <br />}
            </span>
        );
    });
};

function LearnovaAI() {
    const { t } = useTranslation();
    const location = useLocation();
    const { isAuthenticated } = useAuth();
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
    const [supportMode, setSupportMode] = useState(false);
    const [supportConversation, setSupportConversation] = useState(null);
    const [supportMessages, setSupportMessages] = useState([]);
    const [supportMessage, setSupportMessage] = useState("");
    const [supportFile, setSupportFile] = useState(null);
    const [supportFilePreview, setSupportFilePreview] = useState("");
    const [supportLoading, setSupportLoading] = useState(false);
    const [supportError, setSupportError] = useState("");
    const [supportConnected, setSupportConnected] = useState(false);
    const [showConnectedNotice, setShowConnectedNotice] = useState(false);
    const [supportTimedOut, setSupportTimedOut] = useState(false);
    const [supportStatusDismissed, setSupportStatusDismissed] = useState(false);
    const supportSeenMessageIdsRef = useRef(new Set());
    const supportBaselineReadyRef = useRef(false);
    const supportMessagesContainerRef = useRef(null);
    const supportMessagesEndRef = useRef(null);
    const supportLastMessageIdRef = useRef(null);
    const supportScrollPendingRef = useRef(false);
    const supportUserScrolledUpRef = useRef(false);
    const supportForceScrollRef = useRef(false);
    const supportConnectedNoticeTimerRef = useRef(null);
    const supportInputRef = useRef(null);

    const supportFaqQuestions = t("chatbot.supportFaq.questions", { returnObjects: true });

    useEffect(() => () => {
        clearTimeout(supportConnectedNoticeTimerRef.current);
    }, []);

    useEffect(() => {
        if (!supportFile) {
            setSupportFilePreview("");
            return undefined;
        }
        const url = URL.createObjectURL(supportFile);
        setSupportFilePreview(url);
        return () => URL.revokeObjectURL(url);
    }, [supportFile]);

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

    const refreshSupportMessages = async (conversationId) => {
        const container = supportMessagesContainerRef.current;
        const distanceFromBottom = container
            ? container.scrollHeight - container.scrollTop - container.clientHeight
            : 0;
        const nextMessages = await getSupportMessagesApi(conversationId);
        const messagesToDisplay = nextMessages || [];
        const previousMessageIds = supportSeenMessageIdsRef.current;
        const currentMessageIds = new Set(messagesToDisplay.map((item) => String(item.id)));
        const lastMessageId = messagesToDisplay.length
            ? String(messagesToDisplay[messagesToDisplay.length - 1].id)
            : null;
        const hasNewMessage = lastMessageId !== supportLastMessageIdRef.current
            || messagesToDisplay.length !== supportMessages.length;

        setSupportMessages(messagesToDisplay);
        supportLastMessageIdRef.current = lastMessageId;
        supportScrollPendingRef.current = !supportBaselineReadyRef.current
            || (hasNewMessage && !supportUserScrolledUpRef.current);
        supportForceScrollRef.current = false;

        // Existing admin messages are only the conversation history. The
        // connection becomes live after a new admin message arrives.
        if (!supportBaselineReadyRef.current) {
            supportSeenMessageIdsRef.current = currentMessageIds;
            supportBaselineReadyRef.current = true;
            return;
        }

        const hasNewAdminMessage = messagesToDisplay.some(
            (item) => item.senderType === "ADMIN" && !previousMessageIds.has(String(item.id))
        );
        supportSeenMessageIdsRef.current = currentMessageIds;

        if (hasNewAdminMessage) {
            setSupportConnected(true);
            setSupportStatusDismissed(false);
            setShowConnectedNotice(true);
            setSupportTimedOut(false);
            clearTimeout(supportConnectedNoticeTimerRef.current);
            supportConnectedNoticeTimerRef.current = setTimeout(() => {
                setShowConnectedNotice(false);
            }, 10000);
        }
    };

    useSupportRealtime((event) => {
        if (!supportConversation?.id || event.conversationId !== supportConversation.id) return;
        const incomingMessage = event.message;
        if (!incomingMessage) return;

        setSupportMessages((currentMessages) => {
            if (currentMessages.some((item) => item.id === incomingMessage.id)) return currentMessages;
            supportForceScrollRef.current = true;
            supportScrollPendingRef.current = !supportUserScrolledUpRef.current;
            return [...currentMessages, incomingMessage];
        });

        if (incomingMessage.senderType === "ADMIN") {
            setSupportConnected(true);
            setSupportStatusDismissed(false);
            setShowConnectedNotice(true);
            setSupportTimedOut(false);
            setSupportStatusDismissed(false);
            clearTimeout(supportConnectedNoticeTimerRef.current);
            supportConnectedNoticeTimerRef.current = setTimeout(() => {
                setShowConnectedNotice(false);
            }, 10000);
        }
    }, supportMode && isOpen ? supportConversation?.id : null);

    useEffect(() => {
        if (!supportMode || !supportConversation?.id) return;
        markSupportConversationReadApi(supportConversation.id).catch(() => {});
    }, [supportMode, supportConversation?.id]);

    useEffect(() => {
        window.__learnovaActiveSupportConversationId = supportMode && supportConversation?.id
            && isOpen
            ? supportConversation.id
            : null;
        window.dispatchEvent(new CustomEvent("learnova:support-conversation-active", {
            detail: { conversationId: window.__learnovaActiveSupportConversationId },
        }));
        return () => {
            if (window.__learnovaActiveSupportConversationId === supportConversation?.id) {
                window.__learnovaActiveSupportConversationId = null;
                window.dispatchEvent(new CustomEvent("learnova:support-conversation-active", {
                    detail: { conversationId: null },
                }));
            }
        };
    }, [isOpen, supportMode, supportConversation?.id]);

    useEffect(() => {
        const queryConversationId = new URLSearchParams(window.location.search).get("supportConversationId");

        const stateConversationId = location.state?.openSupportConversation
            ? location.state.supportConversationId
            : null;
        const pendingConversationId = localStorage.getItem("learnova:pending-support-conversation");
        const conversationId = Number(stateConversationId || queryConversationId || pendingConversationId);
        if (!isAuthenticated || !conversationId) return;
        getMySupportConversationsApi(0, 100).then(async (response) => {
            const conversations = response?.content || [];
            let conversation = conversations.find((item) => String(item.id) === String(conversationId));
            let messagesLoadedDirectly = null;

            // A notification can point to a conversation that is not in the
            // first page anymore. Load it directly so the notification still
            // opens the correct chat instead of silently doing nothing.
            if (!conversation) {
                try {
                    messagesLoadedDirectly = await getSupportMessagesApi(conversationId);
                    conversation = { id: conversationId, updatedAt: null };
                } catch {
                    return;
                }
            }


            setSupportConversation(conversation);
            setSupportMode(true);
            setIsOpen(true);
            setShowGreeting(false);
            const conversationUpdatedAt = conversation.updatedAt ? new Date(conversation.updatedAt).getTime() : 0;
            const recentlyAnswered = conversationUpdatedAt > 0
                && Date.now() - conversationUpdatedAt <= 60 * 1000;
            setSupportConnected(recentlyAnswered);
            setShowConnectedNotice(recentlyAnswered);
            setSupportTimedOut(false);
            setSupportStatusDismissed(false);

            setSupportMessages(messagesLoadedDirectly || []);
            supportSeenMessageIdsRef.current = new Set();
            supportBaselineReadyRef.current = false;
            supportLastMessageIdRef.current = null;
            supportScrollPendingRef.current = true;
            supportForceScrollRef.current = true;
            if (!messagesLoadedDirectly) {
                refreshSupportMessages(conversation.id).catch(() => {});
            }
            localStorage.removeItem("learnova:pending-support-conversation");
            window.history.replaceState({}, "", window.location.pathname);
        }).catch(() => {});
    }, [isAuthenticated, location.pathname, location.search, location.key, location.state]);


    const handleStartSupportChat = async (botMessage) => {
        if (!isAuthenticated) {
            setSupportError("Vui lòng đăng nhập để chat với nhân viên tư vấn.");
            return;
        }

        try {
            setSupportLoading(true);
            setSupportError("");
            const conversation = await createSupportConversationApi({
                subject: "Cần nhân viên tư vấn sau khi đánh giá câu trả lời AI",
                initialMessage: `Tôi cần hỗ trợ thêm sau câu trả lời: ${String(botMessage || "").slice(0, 300)}`,
            });
            supportSeenMessageIdsRef.current = new Set();
            supportBaselineReadyRef.current = false;
            supportLastMessageIdRef.current = null;
            supportForceScrollRef.current = true;
            clearTimeout(supportConnectedNoticeTimerRef.current);
            setSupportConversation(conversation);
            setSupportMode(true);
            setSupportConnected(false);
            setShowConnectedNotice(false);
            setSupportTimedOut(false);
            setSupportMessages([]);
            await refreshSupportMessages(conversation.id);
        } catch (error) {
            setSupportError(error?.response?.data?.message || "Không thể kết nối nhân viên lúc này.");
        } finally {
            setSupportLoading(false);
            requestAnimationFrame(() => supportInputRef.current?.focus());
        }
    };

    const handleSendSupportMessage = async () => {
        if (!supportConversation || (!supportMessage.trim() && !supportFile) || supportLoading) return;

        try {
            setSupportLoading(true);
            let attachmentKey = null;
            if (supportFile) {
                const upload = await generateUploadUrl({
                    type: "CHAT_IMAGE",
                    fileName: supportFile.name,
                    contentType: supportFile.type,
                });
                await uploadFileToS3(upload.uploadUrl, supportFile);
                attachmentKey = upload.fileKey;
            }
            const sentMessage = await sendSupportMessageApi(supportConversation.id, {
                content: supportMessage.trim() || null,
                attachmentKey,
                attachmentName: supportFile?.name || null,
                attachmentContentType: supportFile?.type || null,
            });
            setSupportMessage("");
            setSupportFile(null);
            setSupportFilePreview("");
            supportForceScrollRef.current = true;
            supportScrollPendingRef.current = !supportUserScrolledUpRef.current;
            supportScrollPendingRef.current = !supportUserScrolledUpRef.current;

            setSupportMessages((currentMessages) => !sentMessage || currentMessages.some((item) => item.id === sentMessage.id)
                ? currentMessages
                : [...currentMessages, sentMessage]);
        } catch (error) {
            setSupportError(error?.response?.data?.message || "Không thể gửi tin nhắn.");
        } finally {
            setSupportLoading(false);
            requestAnimationFrame(() => supportInputRef.current?.focus());
        }
    };

    useEffect(() => {
        if (!supportMode || !supportConversation?.id) return undefined;
        const timeout = setTimeout(() => {
            setSupportTimedOut((current) => (supportConnected ? current : true));
        }, 60000);
        const timer = setInterval(() => {
            refreshSupportMessages(supportConversation.id).catch(() => {});
        }, 1000);
        return () => {
            clearTimeout(timeout);
            clearInterval(timer);
        };
    }, [supportMode, supportConversation?.id, supportConnected]);

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
        if (supportMode || !supportMessagesContainerRef.current) return;
        requestAnimationFrame(() => {
            supportMessagesContainerRef.current?.scrollTo({
                top: supportMessagesContainerRef.current.scrollHeight,
                behavior: "smooth",
            });
        });
    }, [messages]);

    useEffect(() => {
        if (!supportMode || !supportScrollPendingRef.current) return;
        if (supportUserScrolledUpRef.current) return;
        supportScrollPendingRef.current = false;
        const scrollToLatest = () => {
            supportMessagesEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
            const container = supportMessagesContainerRef.current;
            if (container) container.scrollTop = container.scrollHeight;
        };
        requestAnimationFrame(() => {
            scrollToLatest();
            requestAnimationFrame(scrollToLatest);
        });
    }, [supportMessages, supportMode]);

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
                            <div className={`avatar-ai ${supportMode && supportConnected ? "avatar-support" : ""}`}>
                                {supportMode && supportConnected ? (
                                    <span className="support-avatar-icon" aria-label="Nhân viên tư vấn">
                                        <UserRound size={25} />
                                        <Headphones size={17} />
                                    </span>
                                ) : (
                                    <img src={chatBot} alt="Learnova AI" />
                                )}
                            </div>

                            <div>
                                <h3>{supportMode ? "Nhân viên tư vấn LearnOva" : "Learnova AI"}</h3>

                                <span className="status">
                                    <span className="dot"></span>
                                    {supportMode ? "Đang hỗ trợ" : "Online"}
                                </span>
                            </div>
                        </div>

                        {supportMode && (
                            <button type="button" className="support-back-btn" onClick={() => setSupportMode(false)} aria-label="Back to AI">
                                <ArrowLeft size={17} />
                            </button>
                        )}
                        <button
                            className="minimize-btn"
                            onClick={() => setIsOpen(false)}
                        >
                            −
                        </button>
                    </div>

                    {/* Body */}
                    <div
                        className="chat-body"
                        ref={supportMessagesContainerRef}
                        onScroll={(event) => {
                            const container = event.currentTarget;
                            const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
                            supportUserScrolledUpRef.current = distanceFromBottom > 40;
                        }}
                    >
                        {supportMode && !supportStatusDismissed && (!supportConnected || showConnectedNotice) && (
                            <div className="support-status-sticky">
                                {!supportConnected && !supportTimedOut && (
                                    <div className="support-connecting-box">
                                        <div className="support-live-heading"><MessageCircle size={17} /><span>Chúng tôi đang kết nối với nhân viên</span><span className="support-connecting-dots"><i></i><i></i><i></i></span></div>
                                        <p>Vui lòng chờ trong giây lát...</p>
                                    </div>
                                )}
                                {supportTimedOut && !supportConnected && (
                                    <div className="support-timeout-box">
                                        <strong>Hiện tại nhân viên của chúng tôi chưa sẵn sàng.</strong>

                                        <p>Bạn có thể liên hệ để được hỗ trợ:</p>
                                        <a href={`tel:${SUPPORT_HOTLINE}`}><Phone size={14} /> {SUPPORT_HOTLINE}</a>
                                        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                                        <button type="button" onClick={() => setSupportStatusDismissed(true)}>OK</button>
                                    </div>
                                )}
                                {showConnectedNotice && <div className="support-live-heading"><MessageCircle size={17} /><span>Đã kết nối với nhân viên tư vấn</span></div>}
                            </div>
                        )}
                        <div className="messages">
                            {supportMode ? (
                                <>
                                    {supportMessages.map((item) => (

                                        <div key={item.id} className={`support-live-message ${item.senderType === "ADMIN" ? "admin" : "user"} ${item.attachmentUrl ? "has-attachment" : ""}`}>
                                            <div className={`support-live-bubble ${item.attachmentUrl ? "has-attachment" : ""}`}>

                                                {item.content && <p>{item.content}</p>}
                                                {item.attachmentUrl && (
                                                    <a href={item.attachmentUrl} target="_blank" rel="noreferrer">
                                                        <img src={item.attachmentUrl} alt={item.attachmentName || "Tệp đính kèm"} />
                                                    </a>
                                                )}
                                                <small>{item.senderType === "ADMIN" ? "Nhân viên" : "Bạn"}</small>
                                            </div>
                                        </div>
                                    ))}

                                    <div ref={supportMessagesEndRef} aria-hidden="true" />

                                    {supportError && <p className="support-live-error">{supportError}</p>}
                                </>
                            ) : (
                                <>
                                    {messages.map((msg) => (
                                        <div key={msg.id} className="message-block">
                                            <div className={`message ${msg.sender}`}>

                                                {renderChatText(msg.text)}
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
                                                        onClick={() => handleDislike(msg.id, msg.text)}
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

                                                    <button
                                                        type="button"
                                                        className="support-chat-trigger"
                                                        onClick={() => handleStartSupportChat(msg.text)}
                                                        disabled={supportLoading}
                                                    >
                                                        <MessageCircle size={15} />
                                                        {isAuthenticated ? "Chat với nhân viên tư vấn" : "Đăng nhập để chat với nhân viên"}
                                                    </button>

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
                                                            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                                                        </div>
                                                    )}

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

                                                    <button
                                                        type="button"
                                                        className="support-chat-trigger"
                                                        onClick={() => handleStartSupportChat(msg.text)}
                                                        disabled={supportLoading}
                                                    >
                                                        <MessageCircle size={15} />
                                                        {isAuthenticated ? "Chat với nhân viên tư vấn" : "Đăng nhập để chat với nhân viên"}
                                                    </button>

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
                                    )}}

                                    {isSending && !hasReceivedFirstChunk && (
                                        <div className="message bot typing-indicator">
                                            Đang trả lời...
                                        </div>
                                    )}

                                    <div ref={messagesEndRef}></div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="chat-footer">
                        {supportMode && supportFile && (
                            <div className="support-file-preview">
                                <img src={supportFilePreview} alt="Ảnh đã chọn" />
                                <span>{supportFile.name}</span>
                                <button type="button" onClick={() => setSupportFile(null)}><X size={14} /></button>
                            </div>
                        )}
                        <div className="input-wrapper">
                            {supportMode && (
                                <label className="support-attach-btn" aria-label="Attach image">
                                    <Paperclip size={18} />
                                    <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => setSupportFile(event.target.files?.[0] || null)} />
                                </label>
                            )}
                            <input
                                type="text"
                                placeholder={supportMode ? "Nhắn tin cho nhân viên..." : "Nhập câu hỏi của bạn..."}
                                value={supportMode ? supportMessage : message}
                                ref={supportMode ? supportInputRef : undefined}
                                ref={supportMode ? supportInputRef : undefined}
                                disabled={isSending || supportLoading}
                                onChange={(e) => supportMode ? setSupportMessage(e.target.value) : setMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        supportMode ? handleSendSupportMessage() : handleSend();
                                    }
                                }}
                            />

                            <button
                                className="send-btn"
                                onClick={supportMode ? handleSendSupportMessage : handleSend}
                                disabled={isSending || supportLoading}
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
