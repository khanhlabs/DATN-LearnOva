import {BookOpen, CheckCircle, Globe, GraduationCap, Image, PlayCircle, Tag} from "lucide-react";

const formatPrice = (price) => {
    if (price === "" || price === null || price === undefined) return null;
    const n = Number(price);
    if (n === 0) return "Free";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(n);
};

const CoursePreview = ({course, sections}) => {
    const lessonCount = sections.reduce((total, s) => total + s.lessons.length, 0);
    const courseTitle = course.title || "Untitled course";
    const formattedPrice = formatPrice(course.basePrice);
    const whatYouLearn = (course.whatYouLearn || []).filter(Boolean);
    const requirements = (course.requirements || []).filter(Boolean);

    return (
        <div className="teacher-preview-layout">
            <section className="teacher-create-card teacher-student-preview">
                <div className="teacher-student-preview__media">
                    {course.thumbnailPreviewUrl ? (
                        <img src={course.thumbnailPreviewUrl} alt={courseTitle}/>
                    ) : (
                        <span className="teacher-student-preview__placeholder">
                            <Image size={34}/>
                        </span>
                    )}
                </div>

                <div className="teacher-student-preview__body">
                    <h2>{courseTitle}</h2>

                    {course.description && (
                        <p className="teacher-student-preview__desc">{course.description}</p>
                    )}

                    <div className="teacher-student-preview__meta">
                        {course.level && <span><GraduationCap size={14}/>{course.level}</span>}
                        {course.language && <span><Globe size={14}/>{course.language}</span>}
                        {course.category && <span><Tag size={14}/>Category</span>}
                        <span><BookOpen size={14}/>{lessonCount} lesson{lessonCount !== 1 ? "s" : ""}</span>
                    </div>

                    {formattedPrice && (
                        <div className="teacher-student-preview__price">{formattedPrice}</div>
                    )}
                </div>

                {whatYouLearn.length > 0 && (
                    <div className="teacher-student-preview__section">
                        <h3>What You'll Learn</h3>
                        <ul>
                            {whatYouLearn.map((item, i) => (
                                <li key={i}><CheckCircle size={13}/>{item}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {requirements.length > 0 && (
                    <div className="teacher-student-preview__section">
                        <h3>Requirements</h3>
                        <ul className="teacher-student-preview__requirements">
                            {requirements.map((item, i) => (
                                <li key={i}>- {item}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>

            <aside className="teacher-create-card teacher-preview-curriculum">
                <h3>Course Content</h3>
                <p className="teacher-preview-curriculum__summary">
                    {sections.length} section{sections.length !== 1 ? "s" : ""} · {lessonCount} lesson{lessonCount !== 1 ? "s" : ""}
                </p>
                {sections.length > 0 ? (
                    sections.map((section, index) => (
                        <details key={section.id} open={index === 0}>
                            <summary>
                                <strong>
                                    Section {section.sectionOrder}: {section.title || <em>Untitled section</em>}
                                </strong>
                                <span>{section.lessons.length} lesson{section.lessons.length !== 1 ? "s" : ""}</span>
                            </summary>
                            {section.lessons.map((lesson) => (
                                <div key={lesson.id} className="teacher-preview-lesson">
                                    <PlayCircle size={13}/>
                                    <span>{lesson.lessonOrder}. {lesson.title || <em>Untitled lesson</em>}</span>
                                </div>
                            ))}
                        </details>
                    ))
                ) : (
                    <p className="teacher-preview-empty">No sections added yet.</p>
                )}
            </aside>
        </div>
    );
};

export default CoursePreview;
