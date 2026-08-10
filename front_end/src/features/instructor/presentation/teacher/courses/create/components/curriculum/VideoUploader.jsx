import {useRef, useState} from "react";
import {Film, Loader2, RefreshCw, Upload} from "lucide-react";
import {validateVideo} from "../../utils/courseValidation";
import {generateUploadUrl} from "../../../../../../infrastructure/api/teacher/UploadApi";
import {uploadFileWithProgress} from "../../../../../../../../shared/services/UploadService";

const formatDuration = (secs) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
};

const getVideoDuration = (file) =>
    new Promise((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve(Math.floor(video.duration) || null);
        };
        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            resolve(null);
        };
        video.src = URL.createObjectURL(file);
    });

const VideoUploader = ({lessonId, accept, initialFile, onUploadComplete}) => {
    const [state, setState] = useState(
        initialFile ? {kind: "done", file: initialFile} : {kind: "idle"}
    );
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    const handleFileChange = async (e) => {
        const [file] = e.target.files;
        if (!file) return;
        e.target.value = "";

        const validationError = validateVideo(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        setState({kind: "uploading"});
        setProgress(0);

        try {
            const durationSeconds = await getVideoDuration(file);

            const {uploadUrl, fileKey} = await generateUploadUrl({
                type: "VIDEO",
                fileName: file.name,
                contentType: file.type,
            });

            await uploadFileWithProgress(uploadUrl, file, setProgress);

            const result = {
                key: fileKey,
                name: file.name,
                contentType: file.type,
                sizeBytes: file.size,
                durationSeconds,
            };

            setState({kind: "done", file: {name: file.name, durationSeconds}});
            onUploadComplete?.(result);
        } catch {
            setError("Upload failed. Please try again.");
            setState({kind: "idle"});
        }
    };

    return (
        <div className="teacher-video-uploader">
            {state.kind === "uploading" ? (
                <div className="teacher-video-uploader__progress">
                    <Loader2 size={13} className="teacher-spin"/>
                    <div className="teacher-upload-progress-bar">
                        <div
                            className="teacher-upload-progress-bar__fill"
                            style={{width: `${progress}%`}}
                        />
                    </div>
                    <span className="teacher-video-uploader__pct">{progress}%</span>
                </div>
            ) : state.kind === "done" ? (
                <div className="teacher-video-uploader__done">
                    <Film size={13}/>
                    <span className="teacher-video-uploader__name" title={state.file.name}>
                        {state.file.name}
                    </span>
                    {state.file.durationSeconds && (
                        <span className="teacher-video-uploader__duration">
                            {formatDuration(state.file.durationSeconds)}
                        </span>
                    )}
                    <button
                        type="button"
                        className="teacher-video-uploader__replace"
                        onClick={() => inputRef.current?.click()}
                        aria-label="Replace video"
                    >
                        <RefreshCw size={12}/>
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    aria-label="Upload video"
                >
                    <Upload size={16}/>
                </button>
            )}

            {error && <span className="teacher-video-uploader__error">{error}</span>}

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
            />
        </div>
    );
};

export default VideoUploader;
