import {generateUploadUrl} from "../../../../../infrastructure/api/teacher/UploadApi";
import {uploadFileToS3} from "../../../../../../../shared/services/UploadService";

export const useCourseUpload = ({onCourseChange, onLessonSourceChange} = {}) => {

    const handleThumbnailSelected = async (file) => {
        const {uploadUrl, fileKey} = await generateUploadUrl({
            type: "THUMBNAIL",
            fileName: file.name,
            contentType: file.type,
        });
        await uploadFileToS3(uploadUrl, file);
        onCourseChange?.({
            thumbnailKey: fileKey,
            thumbnailPreviewUrl: URL.createObjectURL(file),
        });
    };

    const handleLessonSourceSelected = (sectionId, lessonId, file) => {
        onLessonSourceChange?.(sectionId, lessonId, file);
    };

    return {
        handleThumbnailSelected,
        handleLessonSourceSelected,
    };
};
