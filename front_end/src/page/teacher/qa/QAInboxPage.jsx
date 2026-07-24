import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { HelpCircle, MessageSquare } from "lucide-react";
import QAToolbar from "./components/QAToolbar.jsx";
import QATable from "./components/QATable.jsx";
import { getMyQuestions, setQuestionSolved, setQuestionPinned, answerQuestion } from "../../../api/teacher/QAApi.js";
import { buildCourseFilterOptions, filterQuestions } from "./qaPageUtils.js";
import "./QAInboxPage.css";

const QAInboxPage = () => {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("ALL");

  useEffect(() => {
    getMyQuestions()
      .then(setQuestions)
      .catch(() => toast.error("Failed to load questions."))
      .finally(() => setIsLoading(false));
  }, []);

  const courseFilterOptions = useMemo(() => buildCourseFilterOptions(questions), [questions]);

  const filteredQuestions = useMemo(
    () => filterQuestions({ questions, query, statusFilter, courseFilter }),
    [questions, query, statusFilter, courseFilter]
  );

  const unsolvedCount = useMemo(() => questions.filter((q) => !q.isSolved).length, [questions]);

  const handleToggleSolved = async (question) => {
    try {
      const nextValue = !question.isSolved;
      await setQuestionSolved(question.id, nextValue);
      setQuestions((prev) =>
        prev.map((q) => (q.id === question.id ? { ...q, isSolved: nextValue } : q))
      );
      toast.success(nextValue ? "Marked as solved." : "Marked as unsolved.");
    } catch {
      toast.error("Failed to update question. Please try again.");
    }
  };

  const handleTogglePinned = async (question) => {
    try {
      const nextValue = !question.isPinned;
      await setQuestionPinned(question.id, nextValue);
      setQuestions((prev) =>
        prev.map((q) => (q.id === question.id ? { ...q, isPinned: nextValue } : q))
      );
      toast.success(nextValue ? "Question pinned." : "Question unpinned.");
    } catch {
      toast.error("Failed to update question. Please try again.");
    }
  };

  const handleAnswer = async (question, content) => {
    try {
      await answerQuestion(question.id, content);
      setQuestions((prev) =>
        prev.map((q) => (q.id === question.id ? { ...q, answerCount: q.answerCount + 1 } : q))
      );
      toast.success("Answer submitted successfully.");
    } catch (error) {
      toast.error("Failed to submit answer. Please try again.");
      throw error;
    }
  };

  if (isLoading) {
    return (
      <section className="teacher-page teacher-qa-page">
        <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
          Loading questions...
        </div>
      </section>
    );
  }

  return (
    <section className="teacher-page teacher-qa-page">
      <div className="teacher-qa-summary">
        <div className="teacher-qa-summary__item">
          <span className="teacher-qa-summary__icon teacher-qa-summary__icon--amber">
            <HelpCircle size={20} />
          </span>
          <div>
            <strong>{unsolvedCount}</strong>
            <span>Unsolved</span>
          </div>
        </div>
        <div className="teacher-qa-summary__item">
          <span className="teacher-qa-summary__icon teacher-qa-summary__icon--blue">
            <MessageSquare size={20} />
          </span>
          <div>
            <strong>{questions.length}</strong>
            <span>Total Questions</span>
          </div>
        </div>
      </div>

      <QAToolbar
        query={query}
        onQueryChange={setQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        courseFilter={courseFilter}
        onCourseFilterChange={setCourseFilter}
        courseFilterOptions={courseFilterOptions}
      />

      <QATable
        questions={filteredQuestions}
        onToggleSolved={handleToggleSolved}
        onTogglePinned={handleTogglePinned}
        onAnswer={handleAnswer}
      />
    </section>
  );
};

export default QAInboxPage;
