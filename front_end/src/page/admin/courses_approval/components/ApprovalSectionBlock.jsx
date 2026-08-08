import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import ApprovalLessonRow from "./ApprovalLessonRow.jsx";

const ApprovalSectionBlock = ({ section }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="approvalSection">
      <button
        type="button"
        className="approvalSectionHeader"
        onClick={() => setExpanded((currentValue) => !currentValue)}
        aria-expanded={expanded}
      >
        <span className="approvalSectionToggle">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <span className="approvalSectionTitle">{section.title}</span>
        <span className="approvalSectionCount">{section.lessons.length} lessons</span>
      </button>

      {expanded && (
        <ul className="approvalLessonList">
          {section.lessons.length === 0 ? (
            <li className="approvalLessonEmpty">No lessons in this section.</li>
          ) : (
            section.lessons.map((lesson) => (
              <ApprovalLessonRow key={lesson.lessonId} lesson={lesson} />
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default ApprovalSectionBlock;
