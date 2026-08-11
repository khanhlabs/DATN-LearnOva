import { Clock, FileText, PlayCircle } from "lucide-react";

const formatDuration = (seconds) => {
  const totalSeconds = Number(seconds || 0);
  if (totalSeconds <= 0) return "0m";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const ApprovalLessonRow = ({ lesson }) => (
  <li className="approvalLessonItem">
    <div className="approvalLessonLeft">
      {lesson.videoKey ? (
        <PlayCircle size={15} className="approvalLessonTypeIcon approvalLessonTypeIcon--video" />
      ) : (
        <FileText size={15} className="approvalLessonTypeIcon approvalLessonTypeIcon--empty" />
      )}
      <span className="approvalLessonTitle">{lesson.title}</span>
    </div>

    <div className="approvalLessonRight">
      {lesson.isPreview && <span className="approvalPreviewBadge">Preview</span>}
      {lesson.videoKey ? (
        <span className="approvalVideoStatus approvalVideoStatus--has">Video</span>
      ) : (
        <span className="approvalVideoStatus approvalVideoStatus--none">No video</span>
      )}
      {lesson.durationSeconds > 0 && (
        <span className="approvalLessonDur">
          <Clock size={12} />
          {formatDuration(lesson.durationSeconds)}
        </span>
      )}
    </div>
  </li>
);

export default ApprovalLessonRow;
