import {useEffect, useState} from "react";
import {Plus} from "lucide-react";
import {
    COURSE_DESCRIPTION_MAX_LENGTH,
    COURSE_TITLE_MAX_LENGTH,
    validateCourseInfo,
} from "../../utils/courseValidation";
import ThumbnailUploader from "./ThumbnailUploader";
import {getActiveCategories} from "../../../../../../infrastructure/api/teacher/CoursesApi";

const INITIAL_TOUCHED = {title: false, description: false, basePrice: false};

const CourseInfoStep = ({
                            course,
                            onCourseChange,
                            onThumbnailSelected,
                            onThumbnailRemove,
                            onListChange,
                            onAddListItem,
                            onCancel,
                            onNext,
                            isSubmitting,
                        }) => {
    const [categories, setCategories] = useState([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [touched, setTouched] = useState(INITIAL_TOUCHED);

    const errors = validateCourseInfo(course);
    const isFormValid = Object.keys(errors).length === 0;

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoadingCategories(true);
        getActiveCategories()
            .then((data) => setCategories(Array.isArray(data) ? data : []))
            .catch(() => {})
            .finally(() => setIsLoadingCategories(false));
    }, []);

    const updateField = (e) => {
        const {name, value} = e.target;
        onCourseChange({[name]: value});
    };

    const handleBlur = (field) =>
        setTouched((t) => ({...t, [field]: true}));

    const handleNext = () => {
        setTouched({title: true, description: true, basePrice: true});
        if (!isFormValid) return;
        onNext();
    };

    const fieldClass = (field) =>
        `teacher-create-field${touched[field] && errors[field] ? " teacher-create-field--error" : ""}`;

    return (
        <section className="teacher-create-step">
            <div className="teacher-create-card teacher-course-info-card">
                <ThumbnailUploader
                    currentFileUrl={course.thumbnailPreviewUrl}
                    onUpload={onThumbnailSelected}
                    onRemove={onThumbnailRemove}
                />

                <div className="teacher-course-info-card__main">
                    <div className={fieldClass("title")}>
                        <div className="teacher-create-field__label-row">
                            <span>Course Title *</span>
                            <small>{course.title.length}/{COURSE_TITLE_MAX_LENGTH}</small>
                        </div>
                        <input
                            name="title"
                            value={course.title}
                            onChange={updateField}
                            onBlur={() => handleBlur("title")}
                            maxLength={COURSE_TITLE_MAX_LENGTH}
                            placeholder="Enter an engaging course title"
                        />
                        {touched.title && errors.title && (
                            <span className="teacher-create-field__error">{errors.title}</span>
                        )}
                    </div>

                    <div className={`teacher-create-field teacher-create-field--wide${touched.description && errors.description ? " teacher-create-field--error" : ""}`}>
                        <span>Description *</span>
                        <textarea
                            name="description"
                            value={course.description}
                            onChange={updateField}
                            onBlur={() => handleBlur("description")}
                            maxLength={COURSE_DESCRIPTION_MAX_LENGTH}
                            placeholder="Write a detailed description about your course..."
                        />
                        <small>{course.description.length}/{COURSE_DESCRIPTION_MAX_LENGTH}</small>
                        {touched.description && errors.description && (
                            <span className="teacher-create-field__error">{errors.description}</span>
                        )}
                    </div>
                </div>

                <div className="teacher-create-form-grid">
                    <label className="teacher-create-field">
                        <span>Language</span>
                        <select name="language" value={course.language} onChange={updateField}>
                            <option value="">Select language</option>
                            <option>English</option>
                            <option>Vietnamese</option>
                        </select>
                    </label>

                    <label className="teacher-create-field">
                        <span>Level</span>
                        <select name="level" value={course.level} onChange={updateField}>
                            <option value="">Select level</option>
                            <option>Beginner</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                        </select>
                    </label>

                    <label className="teacher-create-field">
                        <span>Category</span>
                        <select
                            name="category"
                            value={course.category}
                            onChange={updateField}
                            disabled={isLoadingCategories}
                        >
                            <option value="">
                                {isLoadingCategories ? "Loading categories..." : "Select category"}
                            </option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </label>

                    <div className={fieldClass("basePrice")}>
                        <span>Price ($) *</span>
                        <input
                            name="basePrice"
                            type="number"
                            min="0"
                            value={course.basePrice}
                            onChange={updateField}
                            onBlur={() => handleBlur("basePrice")}
                            placeholder="0"
                        />
                        {touched.basePrice && errors.basePrice && (
                            <span className="teacher-create-field__error">{errors.basePrice}</span>
                        )}
                    </div>
                </div>

                <div className="teacher-create-list-grid">
                    <div className="teacher-create-list-card">
                        <h2>What Students Will Learn</h2>
                        {course.whatYouLearn.map((item, index) => (
                            <input
                                key={`learn-${index}`}
                                value={item}
                                onChange={(e) => onListChange("whatYouLearn", index, e.target.value)}
                                placeholder="e.g. Build real-world projects"
                            />
                        ))}
                        <button type="button" onClick={() => onAddListItem("whatYouLearn")}>
                            <Plus size={15}/>
                            Add another learning outcome
                        </button>
                    </div>

                    <div className="teacher-create-list-card">
                        <h2>Requirements</h2>
                        {course.requirements.map((item, index) => (
                            <input
                                key={`requirement-${index}`}
                                value={item}
                                onChange={(e) => onListChange("requirements", index, e.target.value)}
                                placeholder="e.g. Basic computer skills"
                            />
                        ))}
                        <button type="button" onClick={() => onAddListItem("requirements")}>
                            <Plus size={15}/>
                            Add more
                        </button>
                    </div>
                </div>
            </div>

            <footer className="teacher-create-actions">
                <button type="button" onClick={onCancel}>
                    Cancel
                </button>
                <button type="button" onClick={handleNext} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save & Continue"}
                </button>
            </footer>
        </section>
    );
};

export default CourseInfoStep;
