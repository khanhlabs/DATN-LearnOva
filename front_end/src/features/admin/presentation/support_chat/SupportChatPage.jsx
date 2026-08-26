import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCheck, Clock3, MessageCircle, MoreHorizontal, Paperclip,
  Search, Send, UserRound, X,
} from "lucide-react";
import { useAxiosPrivate } from "../../../../shared/hooks/useAxiosPrivate";
import { useSupportRealtime } from "../../../../shared/hooks/useSupportRealtime";
import { markSupportConversationReadApi } from "../../../notification/infrastructure/api/NotificationApi";
import { generateUploadUrl } from "../../../../shared/api/upload/UploadApi";
import { uploadFileToS3 } from "../../../../shared/services/UploadService";
import {
  getAdminSupportConversationsApi,
  getAdminSupportMessagesApi,
  sendAdminSupportMessageApi,
  updateSupportConversationStatusApi,
} from "../../../support/infrastructure/api/SupportApi";
import "./SupportChatPage.css";

const statusLabels = { all: "Tất cả", waiting: "Đang chờ", "in-progress": "Đang xử lý", closed: "Đã đóng" };

const mapConversation = (item) => ({
  ...item,
  name: item.userName || "Người dùng",
  email: item.userEmail || "",
  status: String(item.status || "WAITING").toLowerCase().replace("_", "-"),
  unread: Boolean(item.unreadForAdmin),
  lastMessage: item.lastMessage || null,
  time: item.updatedAt ? new Date(item.updatedAt).toLocaleString("vi-VN") : "Vừa xong",
  subject: item.subject || "Yêu cầu hỗ trợ",
});

const SupportChatPage = () => {
  const axiosPrivate = useAxiosPrivate();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesContainerRef = useRef(null);
  const forceScrollBottomRef = useRef(false);
  const autoScrollAfterRenderRef = useRef(false);
  const userScrolledUpRef = useRef(false);
  const composerInputRef = useRef(null);
  const lastLoadedMessageIdRef = useRef(null);

  const selectedConversation = conversations.find((item) => item.id === selectedId) || null;

  useEffect(() => {
    if (!attachment) {
      setAttachmentPreview("");
      return undefined;
    }
    const url = URL.createObjectURL(attachment);
    setAttachmentPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [attachment]);

  const loadConversations = async (keepSelection = true) => {
    try {
      const response = await getAdminSupportConversationsApi(0, 100, axiosPrivate);
      const next = (response?.content || []).map(mapConversation).sort((a, b) => (
        new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
      ));
      setConversations(next);
      const requestedConversationId = Number(new URLSearchParams(window.location.search).get("conversationId"));
      if (requestedConversationId && next.some((item) => item.id === requestedConversationId)) {
        setSelectedId(requestedConversationId);
        window.history.replaceState({}, "", window.location.pathname);
      } else if (!keepSelection && next[0]) setSelectedId(next[0].id);
      if (keepSelection && selectedId && !next.some((item) => item.id === selectedId) && next[0]) {
        setSelectedId(next[0].id);
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Không thể tải danh sách hội thoại.");
    }
  };

  const loadMessages = async (conversationId = selectedId) => {
    if (!conversationId) return;
    const container = messagesContainerRef.current;
    const distanceFromBottom = container
      ? container.scrollHeight - container.scrollTop - container.clientHeight
      : 0;
    try {
      const response = await getAdminSupportMessagesApi(conversationId, axiosPrivate);
      const nextMessages = response || [];
      const lastMessageId = nextMessages.length ? nextMessages[nextMessages.length - 1].id : null;
      const hasNewMessage = lastMessageId !== lastLoadedMessageIdRef.current;
      const shouldScroll = (forceScrollBottomRef.current && !userScrolledUpRef.current)
        || (hasNewMessage && !userScrolledUpRef.current);
      lastLoadedMessageIdRef.current = lastMessageId;
      autoScrollAfterRenderRef.current = shouldScroll;
      setSelectedMessages(nextMessages);
      forceScrollBottomRef.current = false;
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Không thể tải tin nhắn.");
    }
  };

  useSupportRealtime((event) => {
    const incomingMessage = event.message;
    if (event.conversationId === selectedId) {
      setSelectedMessages((currentMessages) => {
        if (!incomingMessage || currentMessages.some((item) => item.id === incomingMessage.id)) return currentMessages;
        if (!userScrolledUpRef.current) {
          forceScrollBottomRef.current = true;
          autoScrollAfterRenderRef.current = true;
        }
        return [...currentMessages, incomingMessage];
      });
    }
    window.setTimeout(() => loadConversations(true).catch(() => {}), 300);
  }, selectedId);

  useEffect(() => {
    if (!selectedId) return;
    markSupportConversationReadApi(selectedId, axiosPrivate).catch(() => {});
  }, [selectedId, axiosPrivate]);

  useEffect(() => {
    window.__learnovaActiveSupportConversationId = selectedId || null;
    window.dispatchEvent(new CustomEvent("learnova:support-conversation-active", {
      detail: { conversationId: window.__learnovaActiveSupportConversationId },
    }));
    return () => {
      if (window.__learnovaActiveSupportConversationId === selectedId) {
        window.__learnovaActiveSupportConversationId = null;
        window.dispatchEvent(new CustomEvent("learnova:support-conversation-active", {
          detail: { conversationId: null },
        }));
      }
    };
  }, [selectedId]);

  useEffect(() => {
    if (!forceScrollBottomRef.current && !autoScrollAfterRenderRef.current) return;
    if (userScrolledUpRef.current) return;
    autoScrollAfterRenderRef.current = false;
    const scrollToBottom = () => {
      if (userScrolledUpRef.current) return;
      const container = messagesContainerRef.current;
      if (container) container.scrollTop = container.scrollHeight;
    };
    requestAnimationFrame(scrollToBottom);
    window.setTimeout(scrollToBottom, 80);
    window.setTimeout(scrollToBottom, 220);
    forceScrollBottomRef.current = false;
  }, [selectedMessages]);

  useEffect(() => {
    loadConversations(false);
    const timer = setInterval(() => loadConversations(true), 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    forceScrollBottomRef.current = true;
    autoScrollAfterRenderRef.current = true;
    userScrolledUpRef.current = false;
    lastLoadedMessageIdRef.current = null;
    loadMessages();
    if (!selectedId) return undefined;
    const timer = setInterval(() => loadMessages(selectedId), 1000);
    return () => clearInterval(timer);
  }, [selectedId]);

  const visibleConversations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return conversations.filter((item) => {
      const matchesFilter = filter === "all" || item.status === filter;
      const matchesSearch = !keyword || item.name.toLowerCase().includes(keyword) || item.subject.toLowerCase().includes(keyword);
      return matchesFilter && matchesSearch;
    });
  }, [conversations, filter, search]);

  const sendMessage = async () => {
    if (!selectedId || (!draft.trim() && !attachment) || loading) return;
    try {
      setLoading(true);
      let attachmentKey = null;
      if (attachment) {
        const upload = await generateUploadUrl({ type: "CHAT_IMAGE", fileName: attachment.name, contentType: attachment.type });
        await uploadFileToS3(upload.uploadUrl, attachment);
        attachmentKey = upload.fileKey;
      }
      const sentMessage = await sendAdminSupportMessageApi(selectedId, {
        content: draft.trim() || null,
        attachmentKey,
        attachmentName: attachment?.name || null,
        attachmentContentType: attachment?.type || null,
      }, axiosPrivate);
      setDraft("");
      setAttachment(null);
      setAttachmentPreview("");
      if (!userScrolledUpRef.current) {
        forceScrollBottomRef.current = true;
        autoScrollAfterRenderRef.current = true;
      }
      setSelectedMessages((currentMessages) => !sentMessage || currentMessages.some((item) => item.id === sentMessage.id)
        ? currentMessages
        : [...currentMessages, sentMessage]);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (userScrolledUpRef.current) return;
        const container = messagesContainerRef.current;
        if (container) container.scrollTop = container.scrollHeight;
      }));
      await loadConversations(true);
      requestAnimationFrame(() => composerInputRef.current?.focus());
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Không thể gửi tin nhắn.");
    } finally {
      setLoading(false);
    }
  };

  const closeConversation = async () => {
    if (!selectedId) return;
    try {
      await updateSupportConversationStatusApi(selectedId, "CLOSED", axiosPrivate);
      await loadConversations(true);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Không thể đóng hội thoại.");
    }
  };

  return (
    <section className="support-chat-page">
      {/*<header className="support-chat-page__header">*/}
      {/*  <div>*/}
      {/*    <p className="support-chat-page__eyebrow">CUSTOMER SUPPORT</p>*/}
      {/*    <h1>Chat với người dùng</h1>*/}
      {/*    <p>Tiếp nhận và giải quyết các câu hỏi được chuyển từ LearnOva AI.</p>*/}
      {/*  </div>*/}
      {/*  <div className="support-chat-page__summary"><MessageCircle size={20} /><strong>{conversations.filter((item) => item.status !== "closed").length}</strong><span>cuộc hội thoại đang mở</span></div>*/}
      {/*</header>*/}

      {error && <div className="support-chat-error">{error}<button type="button" onClick={() => setError("")}>×</button></div>}

      <div className="support-chat-workspace">
        <aside className="support-chat-list">
          <div className="support-chat-list__top">
            <div className="support-chat-list__title-row"><h2>Hộp thư hỗ trợ</h2><span>{conversations.length}</span></div>
            <label className="support-chat-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm người dùng..." /></label>
            <div className="support-chat-filters">
              {Object.entries(statusLabels).map(([key, label]) => <button key={key} type="button" className={filter === key ? "is-active" : ""} onClick={() => setFilter(key)}>{label}</button>)}
            </div>
          </div>
          <div className="support-chat-list__items">
            {visibleConversations.map((conversation) => (

              <button key={conversation.id} type="button" className={`support-chat-preview ${conversation.id === selectedId ? "is-selected" : ""} ${conversation.unread ? "is-unread" : ""}`} onClick={() => setSelectedId(conversation.id)}>

                <span className="support-chat-avatar">{conversation.name.charAt(0)}</span>
                <span className="support-chat-preview__body">
                  <span className="support-chat-preview__line"><strong>{conversation.name}</strong><small>{conversation.time}</small></span>
                  <span className={`support-chat-preview__subject ${conversation.unread ? "is-unread" : ""}`}>
                    {conversation.lastMessage
                      ? `${conversation.lastMessage.senderType === "ADMIN" ? "Bạn: " : ""}${conversation.lastMessage.content || "Đã gửi một hình ảnh"}`
                      : conversation.subject}
                  </span>
                  <span className={`support-chat-status support-chat-status--${conversation.status}`}>{statusLabels[conversation.status]}</span>
                </span>
                {conversation.unread && <span className="support-chat-unread-dot" aria-label="Tin nhắn chưa đọc" />}
              </button>
            ))}
            {!visibleConversations.length && <div className="support-chat-empty-list">Chưa có yêu cầu hỗ trợ.</div>}
          </div>
        </aside>

        {selectedConversation ? (
          <main className="support-chat-detail">
            <div className="support-chat-detail__header">
              <div className="support-chat-detail__user"><span className="support-chat-avatar support-chat-avatar--large">{selectedConversation.name.charAt(0)}</span><div><h2>{selectedConversation.name}</h2><p>{selectedConversation.email}</p></div></div>
              <div className="support-chat-detail__actions"><span className={`support-chat-status support-chat-status--${selectedConversation.status}`}><Clock3 size={14} /> {statusLabels[selectedConversation.status]}</span><button type="button" onClick={closeConversation} title="Đóng hội thoại"><CheckCheck size={19} /></button><button type="button" aria-label="More options"><MoreHorizontal size={21} /></button></div>
            </div>
            {/*<div className="support-chat-topic"><span>Chủ đề hỗ trợ</span><strong>{selectedConversation.subject}</strong></div>*/}
            <div
              className="support-chat-messages"
              ref={messagesContainerRef}
              onScroll={(event) => {
                const container = event.currentTarget;
                const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
                userScrolledUpRef.current = distanceFromBottom > 40;
              }}
            >
              <div className="support-chat-day">Tin nhắn hỗ trợ</div>
              {selectedMessages.map((message) => (
                <div key={message.id} className={`support-chat-message support-chat-message--${message.senderType === "ADMIN" ? "admin" : "user"}`}>
                  {message.senderType !== "ADMIN" && <span className="support-chat-avatar">{selectedConversation.name.charAt(0)}</span>}
                  <div className="support-chat-message__content">
                    {message.content && <p>{message.content}</p>}
                    {message.attachmentUrl && <a className="support-chat-attachment" href={message.attachmentUrl} target="_blank" rel="noreferrer"><img src={message.attachmentUrl} alt={message.attachmentName || "Tệp đính kèm"} /><span>{message.attachmentName || "Xem hình ảnh"}</span></a>}
                    {message.senderType === "ADMIN" && <small><CheckCheck size={13} /> Đã gửi</small>}
                  </div>
                  {message.senderType === "ADMIN" && <span className="support-chat-avatar support-chat-avatar--admin">A</span>}
                </div>
              ))}
              {!selectedMessages.length && <div className="support-chat-empty-list">Chưa có tin nhắn.</div>}
            </div>
            <div className="support-chat-composer">
              {attachment && <div className="support-chat-file-preview"><img src={attachmentPreview} alt="Ảnh đã chọn" /><span>{attachment.name}</span><button type="button" onClick={() => setAttachment(null)}><X size={14} /></button></div>}
              <label className="support-chat-attach"><Paperclip size={20} /><input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => setAttachment(event.target.files?.[0] || null)} /></label>
              <textarea ref={composerInputRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Nhập nội dung trả lời..." rows={1} />
              <button type="button" className="support-chat-send" onClick={sendMessage} disabled={loading} aria-label="Send message"><Send size={19} /></button>
            </div>
          </main>
        ) : (
          <main className="support-chat-no-selection"><UserRound size={38} /><h2>Chưa có cuộc hội thoại</h2><p>Khi người dùng yêu cầu nhân viên, hội thoại sẽ xuất hiện ở đây.</p></main>
        )}
      </div>
    </section>
  );
};

export default SupportChatPage;
