import ApprovalCourseHero from "./ApprovalCourseHero.jsx";
import ApprovalCurriculum from "./ApprovalCurriculum.jsx";

const ApprovalCourseDetail = ({ course, isSubmitting, onApprove, onReject }) => (
  <>
    <ApprovalCourseHero
      course={course}
      isSubmitting={isSubmitting}
      onApprove={onApprove}
      onReject={onReject}
    />

    {course.description && (
      <section className="approvalBlock">
        <h3 className="approvalBlockTitle">Course Description</h3>
        <p className="approvalBlockText">{course.description}</p>
      </section>
    )}

    {(course.requirements.length > 0 || course.whatYouLearn.length > 0) && (
      <div className="approvalTwoCol">
        {course.requirements.length > 0 && (
          <section className="approvalBlock">
            <h3 className="approvalBlockTitle">Requirements</h3>
            <ul className="approvalBlockList">
              {course.requirements.map((requirement, index) => (
                <li key={`${requirement}-${index}`}>{requirement}</li>
              ))}
            </ul>
          </section>
        )}

        {course.whatYouLearn.length > 0 && (
          <section className="approvalBlock">
            <h3 className="approvalBlockTitle">What You Will Learn</h3>
            <ul className="approvalBlockList">
              {course.whatYouLearn.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    )}

    <ApprovalCurriculum course={course} />
  </>
);

export default ApprovalCourseDetail;
