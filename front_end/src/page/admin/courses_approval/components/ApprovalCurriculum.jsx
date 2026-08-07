import ApprovalSectionBlock from "./ApprovalSectionBlock.jsx";

const formatDuration = (seconds) => {
  const totalSeconds = Number(seconds || 0);
  if (totalSeconds <= 0) return "0m";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const ApprovalCurriculum = ({ course }) => (
  <section className="approvalBlock">
    <div className="approvalCurriculumHeader">
      <h3 className="approvalBlockTitle">
        Course Content
        <span className="approvalCurriculumMeta">
          {course.sections.length} sections · {course.lessonCount} lessons ·{" "}
          {formatDuration(course.totalDurationSeconds)}
        </span>
      </h3>
    </div>

    {course.sections.length === 0 ? (
      <div className="approvalEmptyState approvalEmptyState--small">
        This course does not have any content yet.
      </div>
    ) : (
      <div className="approvalCurriculum">
        {course.sections.map((section) => (
          <ApprovalSectionBlock key={section.sectionId} section={section} />
        ))}
      </div>
    )}
  </section>
);

export default ApprovalCurriculum;
