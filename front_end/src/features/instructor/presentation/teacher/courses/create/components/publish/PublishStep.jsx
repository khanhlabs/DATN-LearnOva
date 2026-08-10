import {CheckCircle, GraduationCap, Image, ListChecks, XCircle} from "lucide-react";
import PublishCard from "./PublishCard";

const buildChecklist = (course, sections) => {
    const lessonCount = sections.reduce((t, s) => t + s.lessons.length, 0);
    const allSectionTitles = sections.every((s) => s.title?.trim());
    const allLessonTitles = sections.every((s) => s.lessons.every((l) => l.title?.trim()));

    return [
        {label: "Course title",         ok: Boolean(course.title?.trim())},
        {label: "Course description",   ok: Boolean(course.description?.trim())},
        {label: "Thumbnail image",      ok: Boolean(course.thumbnailPreviewUrl)},
        {label: "Price set",            ok: course.basePrice !== "" && course.basePrice !== null && course.basePrice !== undefined},
        {label: "At least one section", ok: sections.length > 0},
        {label: "At least one lesson",  ok: lessonCount > 0},
        {label: "All section titles",   ok: sections.length === 0 || allSectionTitles},
        {label: "All lesson titles",    ok: lessonCount === 0 || allLessonTitles},
    ];
};

const PublishStep = ({
    course,
    sections,
    status,
    onStatusChange,
    onPublish,
    onPrevious,
    isSubmitting,
}) => {
    const lessonCount = sections.reduce((total, section) => total + section.lessons.length, 0);
    const courseTitle = course.title || "Untitled course";
    const checklist = buildChecklist(course, sections);
    const isReady = checklist.every((item) => item.ok);

    return (
        <section className="teacher-create-step">
            <div className="teacher-publish-layout">
                <div className="teacher-publish-left">
                    <section className="teacher-create-card teacher-course-summary">
                        <h2>Course Summary</h2>
                        <div>
                            {course.thumbnailPreviewUrl ? (
                                <img src={course.thumbnailPreviewUrl} alt={courseTitle}/>
                            ) : (
                                <span className="teacher-course-summary__placeholder">
                                    <Image size={24}/>
                                </span>
                            )}
                            <span>
                                <strong>{courseTitle}</strong>
                                <small><ListChecks size={14}/>{lessonCount} lessons</small>
                                {course.level && <small><GraduationCap size={14}/>{course.level}</small>}
                            </span>
                        </div>
                    </section>

                    <section className="teacher-create-card teacher-readiness-card">
                        <h2>Readiness Checklist</h2>
                        <ul className="teacher-readiness-list">
                            {checklist.map(({label, ok}) => (
                                <li key={label} className={ok ? "teacher-readiness-list__item--ok" : "teacher-readiness-list__item--missing"}>
                                    {ok
                                        ? <CheckCircle size={14}/>
                                        : <XCircle size={14}/>
                                    }
                                    {label}
                                </li>
                            ))}
                        </ul>
                        {!isReady && (
                            <p className="teacher-readiness-card__warning">
                                Complete the items above for the best student experience.
                            </p>
                        )}
                    </section>
                </div>

                <PublishCard
                    status={status}
                    onStatusChange={onStatusChange}
                    onPublish={onPublish}
                    isSubmitting={isSubmitting}
                    isReady={isReady}
                />
            </div>

            <footer className="teacher-create-actions">
                <button type="button" onClick={onPrevious}>
                    Previous: Preview
                </button>
            </footer>
        </section>
    );
};

export default PublishStep;
