import {Rocket} from "lucide-react";

const PublishCard = ({status, onStatusChange, onPublish, isSubmitting, isReady}) => {
    return (
        <section className="teacher-create-card teacher-publish-settings">
            <h2>Publish Settings</h2>

            <div className="teacher-radio-group">
                <h3>Course Status</h3>
                {[
                    ["DRAFT",          "Draft",             "Only you can see this course"],
                    ["PENDING_REVIEW", "Submit for Review", "Send to admin for approval before it goes live"],
                ].map(([value, label, help]) => (
                    <label
                        key={value}
                        className={status === value ? "teacher-radio-card teacher-radio-card--active" : "teacher-radio-card"}
                    >
                        <input type="radio" checked={status === value} onChange={() => onStatusChange(value)}/>
                        <span>
                            <strong>{label}</strong>
                            <small>{help}</small>
                        </span>
                    </label>
                ))}
            </div>

            <button
                type="button"
                className={`teacher-publish-button${!isReady ? " teacher-publish-button--warn" : ""}`}
                onClick={onPublish}
                disabled={isSubmitting}
                title={!isReady ? "Some checklist items are incomplete" : undefined}
            >
                <Rocket size={17}/>
                {isSubmitting ? "Saving..." : status === "PENDING_REVIEW" ? "Submit for Review" : "Save Draft"}
            </button>
        </section>
    );
};

export default PublishCard;
