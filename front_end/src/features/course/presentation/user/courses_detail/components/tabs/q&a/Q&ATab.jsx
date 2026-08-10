import React, { useEffect, useState, useRef, useContext } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { FaInbox } from "react-icons/fa";
import { FaCheck, FaRegCommentDots, FaRegThumbsUp } from "react-icons/fa";
import {FaEllipsisVertical, FaPenToSquare, FaTrashCan} from "react-icons/fa6";
import { getLessonQAApi, createQuestionApi, createAnswerApi, deleteAnswerApi, deleteQuestionApi, updateAnswerApi, updateQuestionApi, setQuestionSolvedApi, setQuestionPinnedApi } from "../../../../../../infrastructure/api/lessonQAApi";
import { AuthContext } from "../../../../../../../../app/providers/AuthContext";

function QATab({
                   lessonId,
                   course,
                   selectedQuestion,
                   setSelectedQuestion,
                   showQuestionForm,
                   setShowQuestionForm,
                   showReplyForm,
                   setShowReplyForm,
                   replyText,
                   setReplyText,
                   handleReplySubmit
               }) {
    const { t } = useTranslation();
    const [questions, setQuestions] = useState([]);
    const [questionContent, setQuestionContent] = useState("");
    const [questionError, setQuestionError] = useState("");
    const [replyError, setReplyError] = useState("");
    const [replyTarget, setReplyTarget] = useState(null);
    const replyFormRef = useRef(null);
    const replyTextareaRef = useRef(null);
    const { currentUser } = useContext(AuthContext);
    const [editId, setEditId] = useState(null);
    const [editText, setEditText] = useState("");
    const [editError, setEditError] = useState("");
    const [editQuestionId, setEditQuestionId] = useState(null);
    const [editQuestionText, setEditQuestionText] = useState("");
    const [editQuestionError, setEditQuestionError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const questionsPerPage = 5;
    const [searchText, setSearchText] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [editAnswer, setEditAnswer] = useState(null);
    const [editLessonId, setEditLessonId] = useState(null);

    const currentUserId =
        currentUser?.id ||
        currentUser?.userId ||
        currentUser?.idUser;
    const isInstructor =
        !!currentUserId &&
        !!course?.instructor?.id &&
        String(currentUserId) === String(course.instructor.id);
    const [openMenuId, setOpenMenuId] = useState(null);
    useEffect(() => {

        const loadQA = async () => {

            try {

                const data = await getLessonQAApi(lessonId);

                console.log("QA DATA =", data);

                setQuestions(data.questions || []);

            } catch (e) {
                console.log(e);
            }

        };

        if (lessonId) {
            loadQA();
        }

    }, [lessonId]);
    const handleCreateQuestion = async () => {

        if (!questionContent.trim()) {
            setQuestionError(t("courseDetail.qa.enterQuestion"));
            return;
        }

        try {

            await createQuestionApi({
                lessonId,
                content: questionContent
            });

            toast.success(t("courseDetail.qa.questionSent"), {
                position: "top-right",
                autoClose: 1000,
                className: "toast-green",
                progressClassName: "toast-progress-white",
                icon: <FaCheck color="#22c55e" />
            });

            setQuestionContent("");
            setQuestionError("");
            setShowQuestionForm(false);

            const data = await getLessonQAApi(lessonId);
            setQuestions(data.questions || []);

        } catch (error) {

            console.log(error);

            toast.error(t("courseDetail.qa.questionSendFailed"), {
                position: "top-right",
                autoClose: 1000
            });

        }
    };
    const handleReplySubmituser = async () => {

        if (!replyText.trim()) {
            setReplyError(t("courseDetail.qa.enterReply"));
            return;
        }

        try {

            console.log("selectedQuestion.id =", selectedQuestion.id);

            console.log("questionId =", selectedQuestion.id);

            console.log("replyText =", replyText);

            console.log(
                JSON.stringify({
                    questionId: selectedQuestion.id,
                    content: replyText
                }, null, 2)
            );
            await createAnswerApi({
                parentId: replyTarget.id,
                content: replyText
            });

            toast.success(t("courseDetail.qa.replySent"), {
                position: "top-right",
                autoClose: 1000,
                className: "toast-green",
                progressClassName: "toast-progress-white",
                icon: <FaCheck color="#22c55e" />
            });

            setReplyText("");
            setReplyError("");
            setShowReplyForm(false);
            setReplyTarget(null);


            const data = await getLessonQAApi(lessonId);

            setQuestions(data.questions || []);

            const updatedQuestion = data.questions.find(
                q => q.id === selectedQuestion.id
            );

            setSelectedQuestion(updatedQuestion);

        } catch (error) {

            console.log(error);

            if (error.response) {
                console.log("Status =", error.response.status);
                console.log("Data =", error.response.data);
            }

            toast.error(t("courseDetail.qa.replySendFailed"), {
                position: "top-right",
                autoClose: 1000
            });

        }
    };
    useEffect(() => {

        const handleClickOutside = () => {
            setOpenMenuId(null);
        };

        window.addEventListener("click", handleClickOutside);

        return () =>
            window.removeEventListener("click", handleClickOutside);

    }, []);
    const renderReplies = (answers) => {

        return answers.map(answer => (

            <div
                key={answer.id}
                className="reply-node"
            >

                <div className="reply-item">

                    <div className="qa-user-card">

                        <div className="answer-by">

                            <div className="qa-avatar">
                                {answer.userName
                                    ?.split(" ")
                                    .map(s => s[0])
                                    .slice(-2)
                                    .join("")}
                            </div>

                            <div className="qa-user-header">

                                <div>

                                    <div className="qa-author-name-in">
                                        {answer.userName}

                                        {answer.instructor && (
                                            <span className="qa-instructor-badge">
                    {t("courseDetail.qa.instructorBadge")}
                </span>
                                        )}
                                    </div>

                                    <div className="qa-author-time-in">
                                        {new Date(answer.createdAt).toLocaleString()}
                                    </div>

                                </div>

                                {(currentUserId === answer.userId || isInstructor) && (

                                    <div className="qa-menu">

                                        <button
                                            className="qa-menu-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();

                                                setOpenMenuId(
                                                    openMenuId === answer.id
                                                        ? null
                                                        : answer.id
                                                );
                                            }}
                                        >
                                            <FaEllipsisVertical />
                                        </button>

                                        {openMenuId === answer.id && (

                                            <div className="qa-dropdown">

                                                {currentUserId === answer.userId && (
                                                    <button
                                                        className="qa-edit-icon"
                                                        onClick={() => {
                                                            setEditId(answer.id);
                                                            setEditText(answer.content);
                                                            setEditAnswer(answer);
                                                        }}
                                                    >
                                                        <FaPenToSquare />
                                                        <span>{t("courseDetail.qa.edit")}</span>
                                                    </button>
                                                )}

                                                <button
                                                    className="qa-delete-icon"
                                                    onClick={() => handleDeleteAnswer(answer.id)}
                                                >
                                                    <FaTrashCan />
                                                    <span>{t("courseDetail.qa.delete")}</span>
                                                </button>

                                            </div>

                                        )}

                                    </div>

                                )}

                            </div>

                        </div>

                        <div>
                            {answer.replyToUserName &&
                                <b className="user-1">@{answer.replyToUserName} </b>
                            }

                            {editId === answer.id ? (
                                <div>
           <textarea
               value={editText}
               onChange={(e) => {
                   setEditText(e.target.value);
                   setEditError("");
               }}
               className="qa-edit-textarea"
           />
                                    {editError && (
                                        <div className="qa-edit-error">
                                            {editError}
                                        </div>
                                    )}

                                    <div className="qa-edit-actions">
                                        <button
                                            className="qa-edit-save-btn"
                                            onClick={() => handleUpdateAnswer(answer.id)}
                                        >
                                            {t("courseDetail.qa.save")}
                                        </button>

                                        <button
                                            className="qa-edit-cancel-btn"
                                            onClick={() => setEditId(null)}
                                        >
                                            {t("courseDetail.qa.cancel")}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <span>{answer.content}</span>
                            )}
                        </div>

                        <div className="qa-actions">
                            <button className={"btn-reply"}
                                    onClick={() => {

                                        setReplyTarget(answer);

                                        setShowReplyForm(true);

                                        setTimeout(() => {

                                            replyFormRef.current?.scrollIntoView({
                                                behavior: "smooth",
                                                block: "center"
                                            });

                                            replyTextareaRef.current?.focus();

                                        }, 100);

                                    }}
                            >
                                <FaRegCommentDots />
                                {t("courseDetail.qa.reply")}
                            </button>
                            <button className="btn-like">
                                <FaRegThumbsUp />
                                <span>{answer.likeCount || 0}</span>
                            </button>
                        </div>


                    </div>

                </div>

                {
                    answer.replies?.length > 0 && (

                        <div className="reply-children">

                            {renderReplies(answer.replies)}

                        </div>

                    )
                }

            </div>

        ));

    };
    const handleDeleteAnswer = async (answerId) => {

        try {

            await deleteAnswerApi(answerId);

            toast.success(t("courseDetail.qa.deleted"));

            setOpenMenuId(null);

            const data = await getLessonQAApi(lessonId);

            setQuestions(data.questions || []);

            const updatedQuestion = data.questions.find(
                q => q.id === selectedQuestion.id
            );

            setSelectedQuestion(updatedQuestion);

        } catch (e) {

            console.log(e);
            toast.error(t("courseDetail.qa.deleteFailed"));
        }
    };
    const handleDeleteQuestion = async (id) => {
        try {
            await deleteQuestionApi(id);

            toast.success(t("courseDetail.qa.deleted"));

            // reset UI trước
            setSelectedQuestion(null);

            // reload data
            const data = await getLessonQAApi(lessonId);
            setQuestions(data.questions || []);

        } catch (e) {
            console.log("DELETE ERROR:", e);
            toast.error("Delete failed!");
        }
    };
    const handleUpdateAnswer = async (id) => {
        const content = editText.trim();


        if (!content) {
            setEditError(t("courseDetail.qa.contentEmpty"));
            return;
        }

        try {
            await updateAnswerApi(id, {
                parentId: editAnswer.parentId,
                content
            });

            setEditId(null);
            setEditText("");
            setEditError("");

            const data = await getLessonQAApi(lessonId);
            setQuestions(data.questions || []);

            const updatedQuestion = data.questions.find(
                q => q.id === selectedQuestion.id
            );

            setSelectedQuestion(updatedQuestion);

            toast.success(t("courseDetail.qa.updated"));
        } catch (e) {

                console.log("Status =", e.response?.status);
                console.log("Response =", e.response?.data);

            console.error(e);
            toast.error(t("courseDetail.qa.updateFailed"));
        }
    };
    const handleUpdateQuestion = async (id) => {
        const content = editQuestionText.trim();

        if (!content) {
            setEditQuestionError(t("courseDetail.qa.questionEmpty"));
            return;
        }

        try {
            await updateQuestionApi(id, {
                lessonId: editLessonId,
                content
            });

            setEditQuestionId(null);
            setEditQuestionText("");
            setEditQuestionError("");

            const data = await getLessonQAApi(lessonId);
            setQuestions(data.questions || []);

            toast.success(t("courseDetail.qa.questionUpdated"));
        } catch (e) {
            console.error(e);
            toast.error(t("courseDetail.qa.updateFailed"));
        }
    };
    const handleToggleSolved = async (q) => {
        try {
            const nextValue = !q.isSolved;
            await setQuestionSolvedApi(q.id, nextValue);

            const data = await getLessonQAApi(lessonId);
            setQuestions(data.questions || []);

            if (selectedQuestion?.id === q.id) {
                setSelectedQuestion(data.questions.find(item => item.id === q.id) || null);
            }

            toast.success(nextValue ? "Marked as solved!" : "Marked as unsolved!");
        } catch (e) {
            console.log(e);
            toast.error("Update failed!");
        }
    };

    const handleTogglePinned = async (q) => {
        try {
            const nextValue = !q.isPinned;
            await setQuestionPinnedApi(q.id, nextValue);

            const data = await getLessonQAApi(lessonId);
            setQuestions(data.questions || []);

            if (selectedQuestion?.id === q.id) {
                setSelectedQuestion(data.questions.find(item => item.id === q.id) || null);
            }

            toast.success(nextValue ? "Question pinned!" : "Question unpinned!");
        } catch (e) {
            console.log(e);
            toast.error("Update failed!");
        }
    };

    const searchedQuestions = (questions || []).filter((q) => {
        const matchSearch =
            q.content.toLowerCase().includes(searchText.toLowerCase()) ||
            q.userName?.toLowerCase().includes(searchText.toLowerCase());

        const matchTab =
            activeTab === "all"
                ? true
                : activeTab === "answered"
                    ? (q.answers && q.answers.length > 0)
                    : (!q.answers || q.answers.length === 0);

        return matchSearch && matchTab;
    });
    const sortedQuestions = [...searchedQuestions].sort((a, b) => {
        if (!!b.isPinned !== !!a.isPinned) return b.isPinned ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedQuestions.length / questionsPerPage);
    const indexOfLastQuestion = currentPage * questionsPerPage;
    const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;

    const filteredQuestions = sortedQuestions.slice(
        indexOfFirstQuestion,
        indexOfLastQuestion
    );

  return (
      <div className="qa-content">


          {/* Filters */}


          {/* Tabs */}
          <div className="qa-tab-section">
              <div className="qa-tabs">
                  <button
                      className={`qa-tab-btn ${activeTab === "all" ? "active" : ""}`}
                      onClick={() => setActiveTab("all")}
                  >
                      {t("courseDetail.qa.allQuestions")}
                  </button>

                  <button
                      className={`qa-tab-btn ${activeTab === "unanswered" ? "active" : ""}`}
                      onClick={() => setActiveTab("unanswered")}
                  >
                      {t("courseDetail.qa.unanswered")}
                  </button>

                  <button
                      className={`qa-tab-btn ${activeTab === "answered" ? "active" : ""}`}
                      onClick={() => setActiveTab("answered")}
                  >
                      {t("courseDetail.qa.answered")}
                  </button>
              </div>
              <span className="qa-total">
                {t("courseDetail.qa.questionsCount", { count: questions.length })}
            </span>
          </div>
          <div className="qa-action-bar">
              <button
                  className="qa-ask-btn"
                  onClick={() => setShowQuestionForm(!showQuestionForm)}
              >
                  +
              </button>


          </div>
          {
              showQuestionForm && (
                  <div className="qa-question-form">

                      <h4>{t("courseDetail.qa.askPlaceholderTitle")}</h4>

                      <textarea
                          placeholder={t("courseDetail.qa.askPlaceholder")}
                          className="qa-textarea"
                          value={questionContent}
                          onChange={(e) => {
                              setQuestionContent(e.target.value);
                              setQuestionError(""); // xóa lỗi khi người dùng nhập
                          }}
                      />

                      {questionError && (
                          <p className="qa-error-message">
                              {questionError}
                          </p>
                      )}

                      <div className="qa-form-actions">
                          <button
                              onClick={() => setShowQuestionForm(false)}
                              className="qa-cancel-btn"
                          >
                              {t("courseDetail.qa.cancel")}
                          </button>

                          <button
                              className="qa-submit-btn"
                              onClick={handleCreateQuestion}
                          >
                              {t("courseDetail.qa.sendQuestion")}
                          </button>
                      </div>

                  </div>
              )
          }

          {/* Q&A List */}
          {/* QA area */}
          {selectedQuestion ? (
              <div className="qa-detail">
                  <button className="qa-back" onClick={() => setSelectedQuestion(null)}>{t("courseDetail.qa.backToList")}</button>

                  <div className="qa-detail-header">
                      <div className="qa-detail-title">
                          {t("courseDetail.qa.question")}
                          {selectedQuestion.isPinned && (
                              <span className="qa-pinned-badge">Pinned</span>
                          )}
                          {selectedQuestion.isSolved && (
                              <span className="qa-solved-badge">Solved</span>
                          )}
                      </div>
                      {(isInstructor || currentUserId === selectedQuestion.userId) && (
                          <div className="qa-instructor-tools">
                              {(isInstructor || currentUserId === selectedQuestion.userId) && (
                                  <button
                                      className="qa-tool-btn"
                                      onClick={() => handleToggleSolved(selectedQuestion)}
                                  >
                                      {selectedQuestion.isSolved ? "Mark unsolved" : "Mark solved"}
                                  </button>
                              )}
                              {isInstructor && (
                                  <button
                                      className="qa-tool-btn"
                                      onClick={() => handleTogglePinned(selectedQuestion)}
                                  >
                                      {selectedQuestion.isPinned ? "Unpin" : "Pin"}
                                  </button>
                              )}
                          </div>
                      )}
                      <div className="qa-detail-meta">

                          <div className="qa-author-info">

                              <div className="qa-avatar-large">
                                  {selectedQuestion.userName
                                      ?.split(" ")
                                      .map(s => s[0])
                                      .slice(-2)
                                      .join("")}
                              </div>
                              <div className="qa-author-name">
                                  {selectedQuestion.userName}
                              </div>

                              <div className="qa-author-time">
                                  {new Date(selectedQuestion.createdAt).toLocaleString()}
                              </div>
                              {/*<div className="qa-author-row">*/}

                              {/*</div>*/}

                              <div className="qa-content">



                                  <div className="qa-question-body">
                                      <p>{selectedQuestion.content}</p>
                                  </div>
                                  <div className="qa-actions">

                                      <button className={"btn-reply"}
                                              onClick={() => {

                                                  setReplyTarget(selectedQuestion);

                                                  setShowReplyForm(true);

                                                  setReplyText("");

                                                  setTimeout(() => {

                                                      replyFormRef.current?.scrollIntoView({
                                                          behavior: "smooth",
                                                          block: "center"
                                                      });

                                                      replyTextareaRef.current?.focus();

                                                  }, 100);

                                              }}
                                      >
                                          <FaRegCommentDots />
                                          <span>{t("courseDetail.qa.reply")}</span>
                                      </button>

                                      <button className="btn-like">
                                          <FaRegThumbsUp />
                                          <span>{selectedQuestion.likeCount || 0}</span>
                                      </button>

                                  </div>

                              </div>

                          </div>

                      </div>

                      {/*<div className="qa-detail-tags">*/}
                      {/*    {selectedQuestion.tags.map((t,i) => <span key={i} className="qa-tag">{t}</span>)}*/}
                      {/*</div>*/}
                  </div>



                  {/* Instructor answer (mock or from data) */}
                  <div className="qa-thread">

                      {renderReplies(selectedQuestion.answers || [])}

                  </div>



                  {/* Reply form */}
                  {showReplyForm && (
                      <div
                          className="qa-reply-form"
                          ref={replyFormRef}
                      >
                          {replyTarget && (
                              <div className="reply-to-box">
                                  {t("courseDetail.qa.replyingTo")} <b className="user-1">@{replyTarget.userName}</b>
                              </div>
                          )}
                          <textarea
                              ref={replyTextareaRef}
                              className={`qa-reply-input ${replyError ? "error" : ""}`}
                                               value={replyText}
                                               onChange={(e) => {
                                                   setReplyText(e.target.value);
                                                   setReplyError("");
                                               }}
                                               placeholder={t("courseDetail.qa.replyPlaceholder")}
                                               rows={4}
                                           />

                          {replyError && (
                              <p className="qa-error-message">
                                  {replyError}
                              </p>
                          )}

                          <div className="qa-reply-actions">
                              <button
                                  className="btn-cancel"
                                  onClick={() => {
                                      setShowReplyForm(false);
                                      setReplyTarget(null);

                                      setReplyText("");
                                  }}
                              >
                                  {t("courseDetail.qa.cancel")}
                              </button>

                              <button
                                  className="btn-primary"
                                  onClick={handleReplySubmituser}
                              >
                                  {t("courseDetail.qa.send")}
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          ) : (
              <div className="qa-items-list">

                  {filteredQuestions && filteredQuestions.length === 0 ? (
                      <div className="qa-empty-state">
                          <div className="qa-empty-icon">
                              <FaInbox size={40} />
                          </div>

                          <h3>{t("courseDetail.qa.noResults")}</h3>

                          <p>
                              {t("courseDetail.qa.noResultsMatch")}{" "}
                              <b>"{searchText}"</b>
                          </p>

                          <button
                              className="qa-reset-btn"
                              onClick={() => {
                                  setSearchText("");
                                  setActiveTab("all");
                              }}
                          >
                              {t("courseDetail.qa.clearFilters")}
                          </button>
                      </div>
                  ) : (
                      (filteredQuestions || []).map(q => (
                          <div
                              key={q.id}
                              className="qa-card"
                              onClick={() => {
                                  if (editQuestionId !== q.id) {
                                      setSelectedQuestion(q);
                                  }
                              }}
                          >

                              <div className="qa-card-top">

                                  <div className="qa-right">

                                      <div className="qa-author">

                                          <div className="qa-avatar">
                                              {q.userName
                                                  ?.split(" ")
                                                  .map(s => s[0])
                                                  .slice(-2)
                                                  .join("")}
                                          </div>

                                          <div className="qa-author-info">

                                              <div className="qa-qa-author-name">
                                                  {q.userName}
                                              </div>

                                              <div className="qa-qa-author-time">
                                                  {new Date(q.createdAt).toLocaleString()}
                                              </div>

                                          </div>

                                      </div>

                                  </div>

                              </div>

                              <div className="qa-middle">

                                  <h5 className="qa-title">
                                      {t("courseDetail.qa.question")}
                                      {q.isPinned && <span className="qa-pinned-badge">Pinned</span>}
                                      {q.isSolved && <span className="qa-solved-badge">Solved</span>}
                                  </h5>

                                  {editQuestionId === q.id ? (
                                      <div className="qa-edit-box">

                            <textarea
                                className="qa-edit-textarea"
                                value={editQuestionText}
                                onChange={(e) => {
                                    setEditQuestionText(e.target.value);
                                    setEditQuestionError("");
                                }}
                            />

                                          {editQuestionError && (
                                              <div className="qa-edit-error">
                                                  {editQuestionError}
                                              </div>
                                          )}

                                          <div className="qa-edit-actions">
                                              <button
                                                  className="qa-edit-save-btn"
                                                  onClick={() => handleUpdateQuestion(q.id)}
                                              >
                                                  {t("courseDetail.qa.save")}
                                              </button>

                                              <button
                                                  className="qa-edit-cancel-btn"
                                                  onClick={() => {
                                                      setEditQuestionId(null);
                                                      setEditQuestionText("");
                                                      setEditQuestionError("");
                                                  }}
                                              >
                                                  {t("courseDetail.qa.cancel")}
                                              </button>
                                          </div>

                                      </div>
                                  ) : (
                                      <p className="qa-description">{q.content}</p>
                                  )}

                              </div>

                              {(currentUserId === q.userId || isInstructor) && (
                                  <div
                                      className="qa-menu"
                                      onClick={(e) => e.stopPropagation()}
                                  >
                                      <button
                                          className="qa-menu-btn"
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenMenuId(
                                                  openMenuId === q.id ? null : q.id
                                              );
                                          }}
                                      >
                                          <FaEllipsisVertical />
                                      </button>

                                      {openMenuId === q.id && (
                                          <div
                                              className="qa-dropdown"
                                              onClick={(e) => e.stopPropagation()}
                                          >
                                              {currentUserId === q.userId && (
                                                  <button
                                                      className="qa-edit-icon"
                                                      onClick={() => {
                                                          setEditQuestionId(q.id);
                                                          setEditQuestionText(q.content);
                                                          setEditLessonId(lessonId);
                                                          setEditQuestionError("");
                                                          setOpenMenuId(null);
                                                      }}
                                                  >
                                                      <FaPenToSquare />
                                                      <span>{t("courseDetail.qa.edit")}</span>
                                                  </button>
                                              )}

                                              <button
                                                  className="qa-delete-icon"
                                                  onClick={() => handleDeleteQuestion(q.id)}
                                              >
                                                  <FaTrashCan />
                                                  <span>{t("courseDetail.qa.delete")}</span>
                                              </button>
                                          </div>
                                      )}
                                  </div>
                              )}

                          </div>
                      ))
                  )}

              </div>
          )}
          {/* Pagination */}
          <div className="qa-pagination">

              <button
                  className="qa-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
              >
                  ‹
              </button>

              {Array.from({ length: totalPages }, (_, index) => (
                  <button
                      key={index + 1}
                      className={`qa-page-btn ${
                          currentPage === index + 1 ? "active" : ""
                      }`}
                      onClick={() => setCurrentPage(index + 1)}
                  >
                      {index + 1}
                  </button>
              ))}

              <button
                  className="qa-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
              >
                  ›
              </button>

          </div>
      </div>
  );
}

export default QATab;