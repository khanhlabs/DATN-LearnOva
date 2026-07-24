import QARow from "./QARow.jsx";

const tableColumns = ["Học viên", "Khóa học / Bài học", "Câu hỏi", "Trạng thái", "Ngày hỏi"];

const QATable = ({ questions, onToggleSolved, onTogglePinned, onAnswer }) => (
  <div className="teacher-qa-panel">
    <div className="teacher-qa-table-head">
      {tableColumns.map((column) => (
        <span key={column}>{column}</span>
      ))}
    </div>

    {questions.length === 0 ? (
      <div className="teacher-qa-empty">No questions available.</div>
    ) : (
      questions.map((question) => (
        <QARow
          key={question.id}
          question={question}
          onToggleSolved={onToggleSolved}
          onTogglePinned={onTogglePinned}
          onAnswer={onAnswer}
        />
      ))
    )}
  </div>
);

export default QATable;
