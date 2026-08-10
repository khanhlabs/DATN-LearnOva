import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCheck } from "react-icons/fa";

import {
    generateQuizApi,
    getQuizApi,
    submitQuizApi,
} from "../../../../../../infrastructure/api/QuizApi";

import "./css/QuizTab.css";

const LETTERS = ["A", "B", "C", "D"];

/**
 *
 * @param {Object} props
 * @param {string|number} props.lessonId ID của lesson đang mở.
 */
function QuizPage({ lessonId }) {
    const { t } = useTranslation();

    const [quiz, setQuiz] = useState(null);

    const [currentQuestion, setCurrentQuestion] = useState(0);

    const [selectedAnswers, setSelectedAnswers] = useState({});

    const [result, setResult] = useState(null);

    const [loading, setLoading] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");

    const translate = useCallback(
        (key, defaultValue, options = {}) =>
            t(key, {
                defaultValue,
                ...options,
            }),
        [t],
    );

    const resetQuizState = useCallback(() => {
        setResult(null);
        setSelectedAnswers({});
        setCurrentQuestion(0);
        setError("");
    }, []);

    const handleGenerate = useCallback(async () => {
        if (!lessonId) {
            setError(
                translate(
                    "courseDetail.quiz.lessonNotFound",
                    "Lesson information was not found.",
                ),
            );
            return;
        }

        setLoading(true);
        setError("");

        try {
            const data = await generateQuizApi(lessonId);

            if (!data) {
                throw new Error("Quiz API returned empty data.");
            }

            setQuiz(data);
            setCurrentQuestion(0);
            setSelectedAnswers({});
            setResult(null);
        } catch (generateError) {
            console.error("Failed to generate quiz:", generateError);

            setError(
                generateError.response?.data?.message ||
                    translate(
                        "courseDetail.quiz.generateError",
                        "Failed to generate quiz. Please try again.",
                    ),
            );
        } finally {
            setLoading(false);
        }
    }, [lessonId, translate]);

    useEffect(() => {
        if (!lessonId) {
            setQuiz(null);
            resetQuizState();
            setLoading(false);
            return undefined;
        }

        let mounted = true;

        const loadOrGenerateQuiz = async () => {
            setLoading(true);
            setQuiz(null);
            resetQuizState();

            try {
                const data = await getQuizApi(lessonId);

                if (mounted) {
                    setQuiz(data);
                }
            } catch (loadError) {
                if (loadError.response?.status === 404) {
                    try {
                        const generatedQuiz = await generateQuizApi(lessonId);

                        if (mounted) {
                            setQuiz(generatedQuiz);
                        }
                    } catch (generateError) {
                        console.error(
                            "Failed to automatically generate quiz:",
                            generateError,
                        );

                        if (mounted) {
                            setError(
                                generateError.response?.data?.message ||
                                    translate(
                                        "courseDetail.quiz.generateError",
                                        "Failed to generate quiz. Please try again.",
                                    ),
                            );
                        }
                    }

                    return;
                }

                console.error("Failed to load quiz:", loadError);

                if (mounted) {
                    setError(
                        loadError.response?.data?.message ||
                            translate(
                                "courseDetail.quiz.loadError",
                                "Failed to load quiz. Please try again.",
                            ),
                    );
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadOrGenerateQuiz();

        return () => {
            mounted = false;
        };
    }, [lessonId, resetQuizState, translate]);

    const handleSelectAnswer = (questionId, optionId) => {
        if (submitting) {
            return;
        }

        setSelectedAnswers((previousAnswers) => ({
            ...previousAnswers,
            [questionId]: optionId,
        }));
    };

    const nextQuestion = () => {
        const totalQuestions = quiz?.questions?.length || 0;

        setCurrentQuestion((previousQuestion) =>
            Math.min(previousQuestion + 1, totalQuestions - 1),
        );
    };

    const prevQuestion = () => {
        setCurrentQuestion((previousQuestion) =>
            Math.max(previousQuestion - 1, 0),
        );
    };

    const handleSubmit = async () => {
        if (!lessonId || !quiz?.questions?.length || submitting) {
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const answers = quiz.questions.map((question) => ({
                questionId: question.questionId,
                selectedOptionId:
                    selectedAnswers[question.questionId] ?? null,
            }));

            const data = await submitQuizApi(lessonId, answers);

            setResult(data);
        } catch (submitError) {
            console.error("Failed to submit quiz:", submitError);

            setError(
                submitError.response?.data?.message ||
                    translate(
                        "courseDetail.quiz.submitError",
                        "Failed to submit quiz. Please try again.",
                    ),
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleRetry = () => {
        resetQuizState();
    };

    if (!lessonId) {
        return (
            <div className="quiz-page">
                <div
                    className="quiz-card"
                    style={{ textAlign: "center" }}
                >
                    <p className="quiz-subtitle">
                        {translate(
                            "courseDetail.quiz.selectLesson",
                            "Please select a lesson before starting the quiz.",
                        )}
                    </p>
                </div>
            </div>
        );
    }

    if (loading && !quiz) {
        return (
            <div className="quiz-page">
                <div
                    className="quiz-card"
                    style={{ textAlign: "center" }}
                >
                    <p className="quiz-subtitle">
                        {translate(
                            "courseDetail.quiz.preparing",
                            "Preparing quiz for this lesson...",
                        )}
                    </p>
                </div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="quiz-page">
                <div
                    className="quiz-card"
                    style={{ textAlign: "center" }}
                >
                    {error && (
                        <p
                            style={{
                                color: "#dc2626",
                                marginBottom: "14px",
                            }}
                        >
                            {error}
                        </p>
                    )}

                    <button
                        className="btn-next button-quiz"
                        type="button"
                        onClick={handleGenerate}
                        disabled={loading}
                    >
                        {loading
                            ? translate(
                                  "courseDetail.quiz.generating",
                                  "Generating...",
                              )
                            : translate(
                                  "courseDetail.quiz.generate",
                                  "Generate quiz",
                              )}
                    </button>
                </div>
            </div>
        );
    }

    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        return (
            <div className="quiz-page">
                <div
                    className="quiz-card"
                    style={{ textAlign: "center" }}
                >
                    <p
                        style={{
                            color: "#dc2626",
                            marginBottom: "14px",
                        }}
                    >
                        {translate(
                            "courseDetail.quiz.noQuestions",
                            "This quiz does not contain any questions.",
                        )}
                    </p>

                    <button
                        className="btn-next button-quiz"
                        type="button"
                        onClick={handleGenerate}
                        disabled={loading}
                    >
                        {loading
                            ? translate(
                                  "courseDetail.quiz.generating",
                                  "Generating...",
                              )
                            : translate(
                                  "courseDetail.quiz.generateAgain",
                                  "Generate again",
                              )}
                    </button>
                </div>
            </div>
        );
    }

    if (result) {
        const score = Number(result.score) || 0;
        const totalQuestions =
            Number(result.totalQuestions) || quiz.questions.length;

        const percent =
            totalQuestions > 0
                ? Math.round((score / totalQuestions) * 100)
                : 0;

        return (
            <div className="quiz-page">
                <div className="quiz-card">
                    <div className="quiz-result">
                        <h2>
                            {translate(
                                "courseDetail.quiz.result",
                                "Quiz Result",
                            )}
                        </h2>

                        <div className="quiz-score">{percent}%</div>

                        <p>
                            {translate(
                                "courseDetail.quiz.correctSummary",
                                "You answered {{score}} out of {{total}} questions correctly.",
                                {
                                    score,
                                    total: totalQuestions,
                                },
                            )}
                        </p>

                        <button
                            className="btn-next"
                            type="button"
                            style={{ marginTop: "24px" }}
                            onClick={handleRetry}
                        >
                            {translate(
                                "courseDetail.quiz.retake",
                                "Retake quiz",
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const question = quiz.questions[currentQuestion];

    if (!question) {
        return (
            <div className="quiz-page">
                <div
                    className="quiz-card"
                    style={{ textAlign: "center" }}
                >
                    <p className="quiz-subtitle">
                        {translate(
                            "courseDetail.quiz.questionNotFound",
                            "The selected question could not be found.",
                        )}
                    </p>

                    <button
                        className="btn-next"
                        type="button"
                        onClick={() => setCurrentQuestion(0)}
                    >
                        {translate(
                            "courseDetail.quiz.backToFirstQuestion",
                            "Back to first question",
                        )}
                    </button>
                </div>
            </div>
        );
    }

    const progress =
        ((currentQuestion + 1) / quiz.questions.length) * 100;

    const isLastQuestion =
        currentQuestion === quiz.questions.length - 1;

    return (
        <div className="quiz-page">
            <div className="quiz-card">
                <div className="quiz-header">
                    <div className="quiz-progress">
                        <span>
                            {translate(
                                "courseDetail.quiz.questionProgress",
                                "Question {{current}} / {{total}}",
                                {
                                    current: currentQuestion + 1,
                                    total: quiz.questions.length,
                                },
                            )}
                        </span>

                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${Math.min(
                                        Math.max(progress, 0),
                                        100,
                                    )}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="quiz-question">
                    {question.questionText}
                </div>

                <div className="quiz-options">
                    {(question.options || []).map((option, index) => {
                        const isActive =
                            selectedAnswers[question.questionId] ===
                            option.optionId;

                        const optionLabel =
                            LETTERS[index] || String(index + 1);

                        return (
                            <button
                                key={option.optionId}
                                className={`quiz-option ${
                                    isActive ? "active" : ""
                                }`}
                                type="button"
                                onClick={() =>
                                    handleSelectAnswer(
                                        question.questionId,
                                        option.optionId,
                                    )
                                }
                                disabled={submitting}
                                aria-pressed={isActive}
                            >
                                <span className="option-letter">
                                    {optionLabel}
                                </span>

                                <span>{option.optionText}</span>

                                {isActive && (
                                    <span className="selected-check">
                                        <FaCheck />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {error && (
                    <p
                        style={{
                            color: "#dc2626",
                            marginTop: "14px",
                        }}
                    >
                        {error}
                    </p>
                )}

                <div className="quiz-footer">
                    <button
                        className="btn-prev"
                        type="button"
                        onClick={prevQuestion}
                        disabled={
                            currentQuestion === 0 || submitting
                        }
                    >
                        {translate(
                            "courseDetail.quiz.previous",
                            "Previous",
                        )}
                    </button>

                    {isLastQuestion ? (
                        <button
                            className="btn-next"
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting
                                ? translate(
                                      "courseDetail.quiz.submitting",
                                      "Submitting...",
                                  )
                                : translate(
                                      "courseDetail.quiz.submit",
                                      "Submit",
                                  )}
                        </button>
                    ) : (
                        <button
                            className="btn-next"
                            type="button"
                            onClick={nextQuestion}
                            disabled={submitting}
                        >
                            {translate(
                                "courseDetail.quiz.next",
                                "Next",
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default QuizPage;