import CoursePreview from "./CoursePreview";

const PreviewStep = ({course, sections, onPrevious, onNext}) => {
    return (
        <section className="teacher-create-step">

            <CoursePreview course={course} sections={sections}/>

            <footer className="teacher-create-actions">
                <button type="button" onClick={onPrevious}>
                    Previous: Sections
                </button>
                <button type="button" onClick={onNext}>
                    Next: Publish
                </button>
            </footer>
        </section>
    );
};

export default PreviewStep;
