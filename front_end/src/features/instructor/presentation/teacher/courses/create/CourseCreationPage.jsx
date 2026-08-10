import {useEffect} from "react";
import {ArrowLeft} from "lucide-react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {useCourseForm} from "./hooks/useCourseForm";
import {useCourseUpload} from "./hooks/useCourseUpload";
import CreateStepper from "./components/stepper/CreateStepper";
import CourseInfoStep from "./components/course-info/CourseInfoStep";
import SectionsStep from "./components/curriculum/SectionsStep";
import PreviewStep from "./components/preview/PreviewStep";
import PublishStep from "./components/publish/PublishStep";
import "./CourseCreationPage";

const CourseCreationPage = () => {
    const navigate = useNavigate();
    const { courseId: editCourseId } = useParams();

    const {
        currentStep,
        setCurrentStep,
        course,
        sections,
        activeSectionId,
        setActiveSectionId,
        isSubmitting,
        isDirty,
        isLoadingEdit,
        updateCourse,
        updateListItem,
        addListItem,
        addSection,
        deleteSection,
        addLesson,
        updateLessonTitle,
        updateLessonType,
        updateLessonSource,
        deleteLesson,
        updateSectionTitle,
        setLessonVideo,
        updateLessonResources,
        removeLessonResource,
        reorderSections,
        reorderLessons,
        removeThumbnail,
        handleCourseInfoNext,
        handleSectionsNext,
        handleSaveDraft,
        handlePublish,
    } = useCourseForm({ editCourseId: editCourseId ?? null });

    const {handleThumbnailSelected, handleLessonSourceSelected} = useCourseUpload({
        onCourseChange: updateCourse,
        onLessonSourceChange: updateLessonSource,
    });

    const handleVideoUploaded = (sectionId, lessonId, result) => {
        setLessonVideo(sectionId, lessonId, result);
    };

    const handleResourcesUploaded = (sectionId, lessonId, results) => {
        updateLessonResources(sectionId, lessonId, results);
    };

    const canNavigateTo = (step) => {
        if (step === currentStep) return false;
        if (step < currentStep) return true;          // always can go back
        if (!course.id) return false;                 // can't skip ahead before draft exists
        if (step === 3 && currentStep < 2) return false;
        if (step === 4 && currentStep < 3) return false;
        return true;
    };

    // Warn before tab close / browser refresh
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) e.preventDefault();
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    if (isLoadingEdit) {
        return (
            <section className="teacher-create-page">
                <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>
                    Loading course data...
                </div>
            </section>
        );
    }

    return (
        <section className="teacher-create-page">
            <header className="teacher-create-page__top">
                <Link to="/learnova/teacher/courses">
                    <ArrowLeft size={15}/>
                    Back to My Courses
                </Link>
                <CreateStepper
                    currentStep={currentStep}
                    canNavigateTo={canNavigateTo}
                    onStepClick={setCurrentStep}
                />
                <button type="button" onClick={handleSaveDraft} disabled={isSubmitting}>
                    {editCourseId ? "Save Changes" : "Save Draft"}
                </button>
            </header>

            {currentStep === 1 && (
                <CourseInfoStep
                    course={course}
                    onCourseChange={updateCourse}
                    onListChange={updateListItem}
                    onAddListItem={addListItem}
                    onThumbnailSelected={handleThumbnailSelected}
                    onThumbnailRemove={removeThumbnail}
                    onCancel={() => navigate("/learnova/teacher/courses")}
                    onNext={handleCourseInfoNext}
                    isSubmitting={isSubmitting}
                />
            )}

            {currentStep === 2 && (
                <SectionsStep
                    courseId={course.id}
                    sections={sections}
                    activeSectionId={activeSectionId}
                    onSelectSection={setActiveSectionId}
                    onAddSection={addSection}
                    onDeleteSection={deleteSection}
                    onAddLesson={addLesson}
                    onLessonTitleChange={updateLessonTitle}
                    onLessonTypeChange={updateLessonType}
                    onLessonSourceChange={handleLessonSourceSelected}
                    onLessonResourceChange={handleResourcesUploaded}
                    onLessonResourceRemove={removeLessonResource}
                    onDeleteLesson={deleteLesson}
                    onSectionsReorder={reorderSections}
                    onLessonsReorder={reorderLessons}
                    onSectionTitleChange={updateSectionTitle}
                    onLessonVideoChange={handleVideoUploaded}
                    onPrevious={() => setCurrentStep(1)}
                    onNext={handleSectionsNext}
                    isSubmitting={isSubmitting}
                />
            )}

            {currentStep === 3 && (
                <PreviewStep
                    course={course}
                    sections={sections}
                    onPrevious={() => setCurrentStep(2)}
                    onNext={() => setCurrentStep(4)}
                />
            )}

            {currentStep === 4 && (
                <PublishStep
                    course={course}
                    sections={sections}
                    status={course.status}
                    onStatusChange={(status) => updateCourse({status})}
                    onPublish={handlePublish}
                    onPrevious={() => setCurrentStep(3)}
                    isSubmitting={isSubmitting}
                />
            )}
        </section>
    );
};

export default CourseCreationPage;
