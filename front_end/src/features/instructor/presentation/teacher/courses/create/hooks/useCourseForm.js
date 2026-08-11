import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {toast} from "react-toastify";
import {
    createDraftCourse,
    createLesson,
    createLessonSource,
    createSection,
    updateCourse as updateCourseApi,
    updateCourseStatus as updateCourseStatusApi,
    updateLesson,
    updateLessonVideo,
    updateSection,
    getCourseForEdit,
    getFileUrl,
} from "../../../../../infrastructure/api/teacher/CoursesApi";
import {clearDraft, loadDraft, useDraftPersistence} from "./useDraftPersistence";

let tempIdCounter = 0;
const generateTempId = () => `temp_${Date.now()}_${tempIdCounter++}`;

const createEmptyCourse = () => ({
    id: null,
    thumbnailKey: "",
    thumbnailPreviewUrl: "",
    title: "",
    description: "",
    language: "",
    level: "",
    category: "",
    basePrice: "",
    status: "DRAFT",
    requirements: [""],
    whatYouLearn: [""],
});

const restoreFromDraft = () => {
    const draft = loadDraft();
    if (!draft) return null;
    return draft;
};

export const useCourseForm = ({ editCourseId = null } = {}) => {
    const navigate = useNavigate();
    // In edit mode, skip sessionStorage draft to avoid loading a different course's draft
    const savedDraft = editCourseId ? null : restoreFromDraft();

    const [currentStep, setCurrentStep] = useState(savedDraft?.currentStep ?? 1);
    const [course, setCourse] = useState(savedDraft?.course ?? createEmptyCourse);
    const [sections, setSections] = useState(savedDraft?.sections ?? []);
    const [activeSectionId, setActiveSectionId] = useState(
        savedDraft?.sections?.[0]?.id ?? null
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isLoadingEdit, setIsLoadingEdit] = useState(!!editCourseId);

    // Show restore banner once on mount if a draft was found
    useEffect(() => {
        if (savedDraft) {
            toast.info("Draft restored from your last session.", {toastId: "draft-restored"});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load existing course data in edit mode
    useEffect(() => {
        if (!editCourseId) return;
        const load = async () => {
            try {
                const data = await getCourseForEdit(editCourseId);

                let thumbnailPreviewUrl = "";
                if (data.thumbnailKey) {
                    try {
                        thumbnailPreviewUrl = await getFileUrl(data.thumbnailKey);
                    } catch {}
                }

                setCourse({
                    id: data.courseId,
                    title: data.title || "",
                    description: data.description || "",
                    language: data.language || "",
                    level: data.level || "",
                    category: data.categoryId ? String(data.categoryId) : "",
                    basePrice: data.basePrice?.toString() || "",
                    thumbnailKey: data.thumbnailKey || "",
                    thumbnailPreviewUrl,
                    status: "DRAFT",
                    requirements: data.requirements?.length ? data.requirements : [""],
                    whatYouLearn: data.whatYouLearn?.length ? data.whatYouLearn : [""],
                });

                if (data.sections?.length > 0) {
                    const formSections = data.sections.map((s) => ({
                        id: s.sectionId,
                        title: s.title,
                        sectionOrder: s.sectionOrder,
                        isNew: false,
                        lessons: s.lessons.map((l) => ({
                            id: l.lessonId,
                            title: l.title,
                            lessonOrder: l.lessonOrder,
                            type: "Video",
                            isPreview: l.isPreview || false,
                            resources: [],
                            isNew: false,
                            videoKey: l.videoKey || "",
                            videoName: l.videoKey ? "Existing video" : "",
                            durationSeconds: l.durationSeconds || null,
                            videoContentType: null,
                            videoSizeBytes: null,
                        })),
                    }));
                    setSections(formSections);
                    setActiveSectionId(formSections[0]?.id ?? null);
                }
            } catch (err) {
                console.error("Failed to load course for editing:", err);
                toast.error("Failed to load course data.");
            } finally {
                setIsLoadingEdit(false);
            }
        };
        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editCourseId]);

    // Auto-save to sessionStorage on every change (only in create mode)
    useDraftPersistence(editCourseId ? null : course, editCourseId ? null : sections, currentStep);

    const markDirty = () => setIsDirty(true);

    const updateCourse = (changes) => {
        setCourse((c) => ({...c, ...changes}));
        markDirty();
    };

    const updateListItem = (field, index, value) => {
        setCourse((c) => ({
            ...c,
            [field]: c[field].map((item, i) => (i === index ? value : item)),
        }));
        markDirty();
    };

    const addListItem = (field) => {
        setCourse((c) => ({...c, [field]: [...c[field], ""]}));
        markDirty();
    };

    const addSection = () => {
        if (!course.id) {
            toast.error("Please save the course draft first.");
            return;
        }
        const tempId = generateTempId();
        setSections((s) => [
            ...s,
            {id: tempId, title: "", sectionOrder: s.length + 1, lessons: [], isNew: true},
        ]);
        setActiveSectionId(tempId);
        markDirty();
    };

    const deleteSection = (sectionId) => {
        const nextActive = sections.find((s) => s.id !== sectionId)?.id ?? null;
        setSections((s) =>
            s.filter((sec) => sec.id !== sectionId)
             .map((sec, i) => ({...sec, sectionOrder: i + 1}))
        );
        if (activeSectionId === sectionId) setActiveSectionId(nextActive);
        markDirty();
    };

    const addLesson = (sectionId) => {
        const target = sections.find((s) => s.id === sectionId);
        if (!target) return;
        const tempId = generateTempId();
        setSections((s) =>
            s.map((sec) => {
                if (sec.id !== sectionId) return sec;
                return {
                    ...sec,
                    lessons: [
                        ...sec.lessons,
                        {id: tempId, title: "", lessonOrder: sec.lessons.length + 1, type: "Video", isPreview: false, resources: [], isNew: true},
                    ],
                };
            })
        );
        markDirty();
    };

    const deleteLesson = (sectionId, lessonId) => {
        setSections((s) =>
            s.map((sec) => {
                if (sec.id !== sectionId) return sec;
                return {
                    ...sec,
                    lessons: sec.lessons
                        .filter((l) => l.id !== lessonId)
                        .map((l, i) => ({...l, lessonOrder: i + 1})),
                };
            })
        );
        markDirty();
    };

    const updateSectionTitle = (sectionId, title) => {
        setSections((s) =>
            s.map((sec) => (sec.id === sectionId ? {...sec, title} : sec))
        );
        markDirty();
    };

    const updateLessonTitle = (sectionId, lessonId, title) => {
        setSections((s) =>
            s.map((sec) => {
                if (sec.id !== sectionId) return sec;
                return {
                    ...sec,
                    lessons: sec.lessons.map((l) => (l.id === lessonId ? {...l, title} : l)),
                };
            })
        );
        markDirty();
    };

    const updateLessonType = (sectionId, lessonId, type) => {
        setSections((s) =>
            s.map((sec) => {
                if (sec.id !== sectionId) return sec;
                return {
                    ...sec,
                    lessons: sec.lessons.map((l) => (l.id === lessonId ? {...l, type} : l)),
                };
            })
        );
    };

    const updateLessonSource = (sectionId, lessonId, source) => {
        setSections((s) =>
            s.map((sec) => {
                if (sec.id !== sectionId) return sec;
                return {
                    ...sec,
                    lessons: sec.lessons.map((l) =>
                        l.id === lessonId ? {...l, sourceKey: source.key, sourceName: source.name} : l
                    ),
                };
            })
        );
        markDirty();
    };

    const setLessonVideo = (sectionId, lessonId, video) => {
        setSections((s) =>
            s.map((sec) => {
                if (sec.id !== sectionId) return sec;
                return {
                    ...sec,
                    lessons: sec.lessons.map((l) =>
                        l.id === lessonId
                            ? {
                                ...l,
                                videoKey: video.key,
                                videoName: video.name,
                                videoContentType: video.contentType,
                                videoSizeBytes: video.sizeBytes,
                                durationSeconds: video.durationSeconds,
                                isVideoChanged: true,
                              }
                            : l
                    ),
                };
            })
        );
        markDirty();
    };

    const updateLessonResources = (sectionId, lessonId, resources) => {
        setSections((s) =>
            s.map((sec) => {
                if (sec.id !== sectionId) return sec;
                return {
                    ...sec,
                    lessons: sec.lessons.map((l) =>
                        l.id === lessonId
                            ? {...l, resources: [...(l.resources || []), ...resources]}
                            : l
                    ),
                };
            })
        );
        markDirty();
    };

    const removeLessonResource = (sectionId, lessonId, resourceIndex) => {
        setSections((s) =>
            s.map((sec) => {
                if (sec.id !== sectionId) return sec;
                return {
                    ...sec,
                    lessons: sec.lessons.map((l) =>
                        l.id === lessonId
                            ? {...l, resources: l.resources.filter((_, i) => i !== resourceIndex)}
                            : l
                    ),
                };
            })
        );
        markDirty();
    };

    const reorderSections = (newOrder) => {
        setSections(newOrder.map((sec, i) => ({...sec, sectionOrder: i + 1})));
        markDirty();
    };

    const reorderLessons = (sectionId, newOrder) => {
        setSections((s) =>
            s.map((sec) =>
                sec.id === sectionId
                    ? {...sec, lessons: newOrder.map((l, i) => ({...l, lessonOrder: i + 1}))}
                    : sec
            )
        );
        markDirty();
    };

    const removeThumbnail = () => {
        setCourse((c) => ({...c, thumbnailKey: "", thumbnailPreviewUrl: ""}));
        markDirty();
    };

    const buildCoursePayload = () => ({
        title: course.title,
        description: course.description,
        language: course.language || "vi",
        level: course.level || "Beginner",
        basePrice: Number(course.basePrice) || 0,
        thumbnailKey: course.thumbnailKey,
        requirements: course.requirements.filter(Boolean),
        whatYouLearn: course.whatYouLearn.filter(Boolean),
        categoryId: course.category ? Number(course.category) : null,
    });

    const saveCourseDraft = async () => {
        const payload = buildCoursePayload();

        if (course.id) {
            // Edit mode: update existing course
            await updateCourseApi(course.id, payload);
            return course.id;
        }

        // Create mode: create new draft
        const data = await createDraftCourse(payload);
        setCourse((c) => ({...c, id: data.courseId}));
        return data.courseId;
    };

    const saveSectionsAndLessons = async () => {
        const sectionIdMap = new Map();
        const lessonIdMap = new Map();

        for (const section of sections) {
            let actualSectionId = section.id;

            if (section.isNew) {
                const sectionData = await createSection(course.id, {
                    title: section.title || "Untitled Section",
                    sectionOrder: section.sectionOrder,
                });
                actualSectionId = sectionData.sectionId;
                sectionIdMap.set(section.id, actualSectionId);
            } else if (section.title) {
                await updateSection(section.id, {title: section.title});
            }

            for (const lesson of section.lessons) {
                let actualLessonId = lesson.id;

                if (lesson.isNew) {
                    const lessonData = await createLesson(actualSectionId, {
                        title: lesson.title || "Untitled Lesson",
                        lessonOrder: lesson.lessonOrder,
                        isPreview: lesson.isPreview || false,
                    });
                    actualLessonId = lessonData.lessonId;
                    lessonIdMap.set(lesson.id, actualLessonId);
                } else if (lesson.title) {
                    await updateLesson(lesson.id, {title: lesson.title});
                }

                // Only update video if it was newly uploaded (isVideoChanged) or lesson is new
                if (lesson.videoKey && (lesson.isNew || lesson.isVideoChanged)) {
                    await updateLessonVideo(actualLessonId, {
                        videoKey: lesson.videoKey,
                        videoOriginalFilename: lesson.videoName,
                        videoContentType: lesson.videoContentType,
                        videoSizeBytes: lesson.videoSizeBytes,
                        durationSeconds: lesson.durationSeconds || null,
                    });
                }

                if (lesson.resources?.length > 0) {
                    for (const resource of lesson.resources) {
                        try {
                            await createLessonSource(actualLessonId, {
                                fileKey: resource.fileKey,
                                originalFileName: resource.fileName,
                                contentType: resource.fileType || null,
                                fileSizeBytes: resource.fileSize || null,
                                resourceType: "Resources",
                            });
                        } catch (err) {
                            console.error("Failed to save resource:", resource.fileName, err);
                        }
                    }
                }
            }
        }

        if (sectionIdMap.size > 0 || lessonIdMap.size > 0) {
            setSections((s) =>
                s.map((sec) => ({
                    ...sec,
                    id: sectionIdMap.get(sec.id) ?? sec.id,
                    isNew: false,
                    lessons: sec.lessons.map((l) => ({
                        ...l,
                        id: lessonIdMap.get(l.id) ?? l.id,
                        isNew: false,
                        isVideoChanged: false,
                    })),
                }))
            );
        }
    };

    const handleCourseInfoNext = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await saveCourseDraft();
            setIsDirty(false);
            if (!editCourseId) clearDraft();
            setCurrentStep(2);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Failed to save course");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSectionsNext = async () => {
        if (isSubmitting) return;

        const emptySections = sections.filter((s) => !s.title?.trim());
        if (emptySections.length > 0) {
            toast.error("Please enter titles for all sections before proceeding.");
            return;
        }

        for (const section of sections) {
            const emptyLessons = section.lessons.filter((l) => !l.title?.trim());
            if (emptyLessons.length > 0) {
                toast.error(`Please enter titles for all lessons in "${section.title}" before proceeding.`);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await saveSectionsAndLessons();
            setIsDirty(false);
            if (!editCourseId) clearDraft();
            setCurrentStep(3);
        } catch (error) {
            let message = "Failed to save sections and lessons";
            if (error.response?.status === 403) message = "Access denied. Please log in again.";
            else if (error.response?.status === 401) message = "Session expired. Please log in again.";
            else if (error.response?.data?.message) message = error.response.data.message;
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveDraft = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await toast.promise(saveCourseDraft(), {
                pending: course.id ? "Updating course..." : "Saving draft...",
                success: course.id ? "Course updated!" : "Draft saved!",
                error: {render: ({data}) => data?.response?.data?.message || data?.message || "Failed to save"},
            });
            setIsDirty(false);
            if (!editCourseId) clearDraft();
            navigate("/learnova/teacher/courses");
        } catch {
            // handled by toast.promise
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePublish = async () => {
        if (isSubmitting) return;
        if (!course.id) {
            toast.error("Save the course draft before submitting.");
            return;
        }
        setIsSubmitting(true);
        try {
            await toast.promise(updateCourseStatusApi(course.id, course.status), {
                pending: "Updating course status...",
                success: course.status === "PENDING_REVIEW" ? "Submitted for review!" : "Draft saved!",
                error: {render: ({data}) => data?.response?.data?.message || "Failed to update status"},
            });
            setIsDirty(false);
            if (!editCourseId) clearDraft();
            navigate("/learnova/teacher/courses");
        } catch {
            // handled by toast.promise
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
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
        deleteLesson,
        updateSectionTitle,
        updateLessonTitle,
        updateLessonType,
        updateLessonSource,
        setLessonVideo,
        updateLessonResources,
        removeLessonResource,
        reorderSections,
        reorderLessons,
        removeThumbnail,
        saveCourseDraft,
        handleCourseInfoNext,
        handleSectionsNext,
        handleSaveDraft,
        handlePublish,
    };
};
