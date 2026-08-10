import {GripVertical} from "lucide-react";
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";

const SectionCard = ({section, isActive, onSelect}) => {
    const isEmpty = !section.title?.trim();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({id: section.id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : undefined,
        zIndex: isDragging ? 1 : undefined,
    };

    return (
        <button
            ref={setNodeRef}
            style={style}
            type="button"
            className={[
                "teacher-section-card",
                isActive ? "teacher-section-card--active" : "",
                isEmpty ? "teacher-section-card--empty" : "",
                isDragging ? "teacher-section-card--dragging" : "",
            ].filter(Boolean).join(" ")}
            onClick={onSelect}
        >
            <span
                className="teacher-section-card__grip"
                {...attributes}
                {...listeners}
                onClick={(e) => e.stopPropagation()}
                aria-label="Drag to reorder section"
            >
                <GripVertical size={14}/>
            </span>
            <span>
                <small>Section {section.sectionOrder}</small>
                <strong>{isEmpty ? "Enter section title..." : section.title}</strong>
            </span>
        </button>
    );
};

export default SectionCard;
