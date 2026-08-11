import {useEffect, useState} from "react";
import {Plus, Trash2} from "lucide-react";
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import LessonRow from "./LessonRow";
import SectionCard from "./SectionCard";

const SectionsStep = ({
                          courseId,
                          sections,
                          activeSectionId,
                          onSelectSection,
                          onAddSection,
                          onDeleteSection,
                          onAddLesson,
                          onLessonTitleChange,
                          onLessonTypeChange,
                          onLessonSourceChange,
                          onLessonResourceChange,
                          onLessonResourceRemove,
                          onDeleteLesson,
                          onSectionTitleChange,
                          onPrevious,
                          onNext,
                          onLessonVideoChange,
                          onSectionsReorder,
                          onLessonsReorder,
                          isSubmitting,
                      }) => {
    const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0] || null;
    const [confirmDeleteSection, setConfirmDeleteSection] = useState(false);

    useEffect(() => {
        setConfirmDeleteSection(false);
    }, [activeSectionId]);

    const isSectionTitleEmpty = activeSection && !activeSection.title?.trim();

    // DnD sensors — pointer (mouse/touch) + keyboard
    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 5}}),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates})
    );

    const handleSectionDragEnd = ({active, over}) => {
        if (!over || active.id === over.id) return;
        const oldIndex = sections.findIndex((s) => s.id === active.id);
        const newIndex = sections.findIndex((s) => s.id === over.id);
        onSectionsReorder?.(arrayMove(sections, oldIndex, newIndex));
    };

    const handleLessonDragEnd = ({active, over}) => {
        if (!activeSection || !over || active.id === over.id) return;
        const lessons = activeSection.lessons;
        const oldIndex = lessons.findIndex((l) => l.id === active.id);
        const newIndex = lessons.findIndex((l) => l.id === over.id);
        onLessonsReorder?.(activeSection.id, arrayMove(lessons, oldIndex, newIndex));
    };

    return (
        <section className="teacher-create-step">
            <div className="teacher-curriculum-layout">
                {/* Section sidebar — sortable */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSectionDragEnd}
                >
                    <SortableContext
                        items={sections.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <aside className="teacher-create-card teacher-section-list">
                            {sections.map((section) => (
                                <SectionCard
                                    key={section.id}
                                    section={section}
                                    isActive={section.id === activeSection?.id}
                                    onSelect={() => onSelectSection(section.id)}
                                />
                            ))}
                            <button
                                type="button"
                                className="teacher-add-section teacher-add-section--bottom"
                                onClick={onAddSection}
                            >
                                <Plus size={15}/>
                                Add Section
                            </button>
                        </aside>
                    </SortableContext>
                </DndContext>

                {/* Section editor — lessons are sortable */}
                <section className="teacher-create-card teacher-section-editor">
                    {activeSection ? (
                        <>
                            <div className="teacher-section-editor__top">
                                <label className={`teacher-create-field${isSectionTitleEmpty ? " teacher-create-field--error" : ""}`}>
                                    <span>Section Title</span>
                                    <input
                                        value={activeSection.title}
                                        onChange={(e) => onSectionTitleChange(activeSection.id, e.target.value)}
                                        placeholder="Enter section title"
                                    />
                                    {isSectionTitleEmpty && (
                                        <span className="teacher-create-field__error">Section title is required.</span>
                                    )}
                                </label>

                                <div className="teacher-delete-confirm">
                                    {confirmDeleteSection ? (
                                        <>
                                            <span>Delete section?</span>
                                            <button
                                                type="button"
                                                className="teacher-delete-confirm__yes"
                                                onClick={() => {
                                                    onDeleteSection(activeSection.id);
                                                    setConfirmDeleteSection(false);
                                                }}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                type="button"
                                                className="teacher-delete-confirm__no"
                                                onClick={() => setConfirmDeleteSection(false)}
                                            >
                                                No
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmDeleteSection(true)}
                                            aria-label="Delete section"
                                        >
                                            <Trash2 size={15}/>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <h2>Lessons</h2>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleLessonDragEnd}
                            >
                                <SortableContext
                                    items={(activeSection.lessons || []).map((l) => l.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="teacher-lesson-builder-list">
                                        {activeSection.lessons.map((lesson) => (
                                            <LessonRow
                                                key={lesson.id}
                                                courseId={courseId}
                                                sectionId={activeSection.id}
                                                lesson={lesson}
                                                onTitleChange={(title) => onLessonTitleChange(activeSection.id, lesson.id, title)}
                                                onTypeChange={(type) => onLessonTypeChange?.(activeSection.id, lesson.id, type)}
                                                onSourceChange={(file) => onLessonSourceChange(activeSection.id, lesson.id, file)}
                                                onVideoChange={(result) => onLessonVideoChange(activeSection.id, lesson.id, result)}
                                                onResourceChange={(results) => onLessonResourceChange?.(activeSection.id, lesson.id, results)}
                                                onResourceRemove={(index) => onLessonResourceRemove?.(activeSection.id, lesson.id, index)}
                                                onDelete={() => onDeleteLesson(activeSection.id, lesson.id)}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>

                            <button
                                type="button"
                                className="teacher-add-lesson"
                                onClick={() => onAddLesson(activeSection.id)}
                            >
                                <Plus size={15}/>
                                Add Lesson
                            </button>
                        </>
                    ) : (
                        <div className="teacher-section-empty">
                            <button type="button" className="teacher-add-section" onClick={onAddSection}>
                                <Plus size={15}/>
                                Add Section
                            </button>
                        </div>
                    )}
                </section>
            </div>

            <footer className="teacher-create-actions">
                <button type="button" onClick={onPrevious}>
                    Previous: Course
                </button>
                <button type="button" onClick={onNext} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Next: Preview"}
                </button>
            </footer>
        </section>
    );
};

export default SectionsStep;
