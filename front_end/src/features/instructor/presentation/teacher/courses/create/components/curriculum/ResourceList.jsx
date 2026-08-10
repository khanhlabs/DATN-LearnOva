import {FileText, X} from "lucide-react";

const ResourceList = ({resources = [], onRemove}) => {
    if (resources.length === 0) {
        return null;
    }

    const formatFileSize = (bytes) => {
        if (!bytes) return "";
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    };

    return (
        <ul className="teacher-lesson-resource-list">
            {resources.map((resource, index) => (
                <li key={resource.fileKey || resource.id || index}>
                    <FileText size={14} />
                    <span>
                        {resource.fileName || resource.name || "Resource"}
                        {resource.fileSize && ` (${formatFileSize(resource.fileSize)})`}
                    </span>
                    {onRemove && (
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            aria-label="Remove resource"
                        >
                            <X size={12} />
                        </button>
                    )}
                </li>
            ))}
        </ul>
    );
};

export default ResourceList;
