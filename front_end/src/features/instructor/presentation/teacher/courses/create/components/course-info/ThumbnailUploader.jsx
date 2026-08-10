import {useRef, useState} from "react";
import {Image, Loader2, RefreshCw, X} from "lucide-react";
import {THUMBNAIL_ACCEPTED_TYPES, validateThumbnail} from "../../utils/courseValidation";

const ThumbnailUploader = ({currentFileUrl, onUpload, onRemove}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    const handleFileChange = async (e) => {
        const [file] = e.target.files;
        if (!file) return;
        e.target.value = "";

        const validationError = validateThumbnail(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        setIsUploading(true);
        try {
            await onUpload(file);
        } catch {
            setError("Upload failed. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="teacher-upload-box">
            {isUploading ? (
                <div className="teacher-upload-box__loading">
                    <Loader2 size={28} className="teacher-spin"/>
                    <span>Uploading...</span>
                </div>
            ) : currentFileUrl ? (
                <div className="teacher-upload-box__preview-wrapper">
                    <img
                        src={currentFileUrl}
                        alt="Course thumbnail"
                        className="teacher-upload-box__preview"
                    />
                    <div className="teacher-upload-box__preview-actions">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            aria-label="Replace thumbnail"
                        >
                            <RefreshCw size={13}/>
                            Replace
                        </button>
                        {onRemove && (
                            <button
                                type="button"
                                className="teacher-upload-box__remove"
                                onClick={onRemove}
                                aria-label="Remove thumbnail"
                            >
                                <X size={13}/>
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    className="teacher-upload-box__trigger"
                    onClick={() => inputRef.current?.click()}
                    aria-label="Upload course thumbnail"
                >
                    <Image size={34}/>
                    <strong>Upload Image</strong>
                    <span>Recommended: 1280×720px</span>
                    <small>JPG, PNG, WebP · max 5 MB</small>
                </button>
            )}

            {error && <span className="teacher-upload-box__error">{error}</span>}

            <input
                ref={inputRef}
                type="file"
                accept={THUMBNAIL_ACCEPTED_TYPES}
                onChange={handleFileChange}
            />
        </div>
    );
};

export default ThumbnailUploader;
