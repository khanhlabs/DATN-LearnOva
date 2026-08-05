import { useState } from "react";
import {
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Play,
    Unlock,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const CourseCurriculum = ({ course }) => {
    const { t } = useTranslation();
    const [expandedChapters, setExpandedChapters] = useState([]);

    const toggleChapter = (chapterId) => {
        setExpandedChapters((prev) =>
            prev.includes(chapterId)
                ? prev.filter((id) => id !== chapterId)
                : [...prev, chapterId]
        );
    };

    return (
        <section className="learning-content-panel">
            <div className="learning-panel-heading">
        <span>
          {t("profile.learningDetail.chaptersLessons", { chapters: course.chaptersTotal, lessons: course.lessonsTotal })}
        </span>

                <button type="button">{t("profile.learningDetail.expandAll")}</button>
            </div>

            <div className="learning-chapter-list">
                {course.curriculum.map((chapter, chapterIndex) => {
                    const expanded = expandedChapters.includes(chapter.id);

                    return (
                        <article
                            className={`learning-chapter ${expanded ? "open" : ""}`}
                            key={chapter.id}
                        >
                            <div
                                className="learning-chapter-header"
                                onClick={() => toggleChapter(chapter.id)}
                                style={{ cursor: "pointer" }}
                            >
                                <div>
                  <span className="learning-chapter-toggle">
                    {expanded ? (
                        <ChevronUp size={16} />
                    ) : (
                        <ChevronDown size={16} />
                    )}
                  </span>

                                    <strong>
                                        {String(chapterIndex + 1).padStart(2, "0")}. {chapter.title}
                                    </strong>
                                </div>

                                <div className="learning-chapter-progress">
                  <span>
                    {chapter.completedLessons}/{chapter.totalLessons}
                  </span>

                                    {chapter.percent > 0 && (
                                        <mark>{chapter.percent}%</mark>
                                    )}
                                </div>
                            </div>

                            {expanded && (
                                <div className="learning-lesson-list">
                                    {chapter.lessons.map((lesson, index) => (
                                        <div
                                            className="learning-lesson-row"
                                            key={lesson.id}
                                        >
                                            <div>
                        <span className="learning-lesson-play">
                          <Play size={13} fill="currentColor" />
                        </span>

                                                <p>
                                                    {chapterIndex + 1}.{index + 1} {lesson.title}
                                                </p>
                                            </div>

                                            <span>{lesson.duration}</span>

                                            {lesson.completed ? (
                                                <CheckCircle2
                                                    className="done"
                                                    size={18}
                                                />
                                            ) : (
                                                <Unlock
                                                    className="pending"
                                                    size={17}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

export default CourseCurriculum;