import {useEffect, useRef, useState} from "react";
import {FileText, FileUp, GripVertical, HelpCircle, Pencil, PlayCircle, Trash2} from "lucide-react";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import ResourceList from "./ResourceList";
import VideoUploader from "./VideoUploader";
import ResourceUploader from "./ResourceUploader";

const RESOURCE_TYPES = [
    {value: "Video", label: "Video", icon: PlayCircle},
    {value: "Document", label: "Document", icon: FileText},
    {value: "Resource", label: "Resource", icon: FileUp},
];

const iconMap = {
    Video: PlayCircle,
    Article: FileText,
    Quiz: HelpCircle,
    Document: FileText,
    Resource: FileUp,
};

const LessonRow = ({
                       courseId,
                       lesson,
                       sectionId,
                       onTitleChange,
                       onTypeChange,
                       onVideoChange,
                       onResourceChange,
                       onResourceRemove,
                       onDelete,
                   }) => {
    const Icon = iconMap[lesson.type] || FileText;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({id: lesson.id});

    const dragStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : undefined,
        zIndex: isDragging ? 1 : undefined,
    };

    const [isEditing, setIsEditing] = useState(false);
    const [draftTitle, setDraftTitle] = useState(lesson.title);
    const [resourceType, setResourceType] = useState(lesson.type || "Video");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const titleInputRef = useRef(null);

    useEffect(() => {
        if (isEditing) {
            titleInputRef.current?.focus();
            titleInputRef.current?.select();
        }
    }, [isEditing]);

    const commitTitle = () => {
        const next = draftTitle.trim();
        if (next !== lesson.title) onTitleChange(next);
        else setDraftTitle(lesson.title);
        setIsEditing(false);
    };

    const cancelTitleEdit = () => {
        setDraftTitle(lesson.title);
        setIsEditing(false);
    };

    const handleTitleKeyDown = (e) => {
        if (e.key === "Enter") commitTitle();
        if (e.key === "Escape") cancelTitleEdit();
    };

    const isEmpty = !lesson.title?.trim();
    const displayTitle = isEmpty
        ? `${lesson.lessonOrder}. Enter lesson title...`
        : `${lesson.lessonOrder}. ${lesson.title}`;

    return (
        <article
            ref={setNodeRef}
            style={dragStyle}
            className={[
                "teacher-lesson-builder-row",
                isEmpty ? "teacher-lesson-builder-row--empty" : "",
                isDragging ? "teacher-lesson-builder-row--dragging" : "",
            ].filter(Boolean).join(" ")}
        >
            <span
                className="teacher-lesson-builder-row__grip"
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder lesson"
            >
                <GripVertical size={15}/>
            </span>
            <span className="teacher-lesson-builder-row__icon">
                <Icon size={18}/>
            </span>

            <div className="teacher-lesson-builder-row__content">
                {isEditing ? (
                    <input
                        ref={titleInputRef}
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        onBlur={commitTitle}
                        onKeyDown={handleTitleKeyDown}
                        aria-label={`Lesson ${lesson.lessonOrder} title`}
                    />
                ) : (
                    <strong className={isEmpty ? "teacher-lesson-builder-row__empty-title" : ""}>
                        {displayTitle}
                    </strong>
                )}
                {lesson.sourceName && <small>{lesson.sourceName}</small>}
                {lesson.videoName && (
                    <small className="teacher-lesson-builder-row__video-tag">🎬 {lesson.videoName}</small>
                )}
                <ResourceList
                    resources={lesson.resources}
                    onRemove={(index) => onResourceRemove?.(index)}
                />
            </div>

            <select
                className="teacher-lesson-builder-row__type-select"
                value={resourceType}
                onChange={(e) => {
                    setResourceType(e.target.value);
                    onTypeChange?.(e.target.value);
                }}
                aria-label="Select resource type"
            >
                {RESOURCE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                ))}
            </select>

            <button type="button" aria-label="Edit title" onClick={() => {
                setDraftTitle(lesson.title);
                setIsEditing(true);
            }}>
                <Pencil size={16}/>
            </button>

            {resourceType === "Video" && (
                <VideoUploader
                    lessonId={lesson.id}
                    accept="video/mp4,video/webm,video/quicktime"
                    initialFile={lesson.videoName ? {name: lesson.videoName, durationSeconds: lesson.durationSeconds} : null}
                    onUploadComplete={(result) => onVideoChange?.(result)}
                />
            )}

            {(resourceType === "Document" || resourceType === "Resource") && (
                <ResourceUploader
                    onUploadComplete={(results) => onResourceChange?.(results)}
                />
            )}

            <div className="teacher-lesson-delete-confirm">
                {confirmDelete ? (
                    <>
                        <span>Delete?</span>
                        <button
                            type="button"
                            className="teacher-delete-confirm__yes"
                            onClick={onDelete}
                        >
                            Yes
                        </button>
                        <button
                            type="button"
                            className="teacher-delete-confirm__no"
                            onClick={() => setConfirmDelete(false)}
                        >
                            No
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        className="teacher-lesson-builder-row__delete"
                        aria-label="Delete lesson"
                        onClick={() => setConfirmDelete(true)}
                    >
                        <Trash2 size={16}/>
                    </button>
                )}
            </div>
        </article>
    );
};

export default LessonRow;
