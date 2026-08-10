import {useRef, useState} from "react";
import {CheckCircle, FileUp, XCircle} from "lucide-react";
import {validateDocument} from "../../utils/courseValidation";
import {generateUploadUrl} from "../../../../../../infrastructure/api/teacher/UploadApi";
import {uploadFileWithProgress} from "../../../../../../../../shared/services/UploadService";

const ResourceUploader = ({onUploadComplete}) => {
    const [queue, setQueue] = useState([]); // [{name, progress, done, error}]
    const fileInputRef = useRef(null);

    const isUploading = queue.some((f) => !f.done);

    const update = (index, patch) =>
        setQueue((q) => q.map((item, i) => (i === index ? {...item, ...patch} : item)));

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        e.target.value = "";

        const initialQueue = files.map((f) => ({name: f.name, progress: 0, done: false, error: null}));
        setQueue(initialQueue);

        const results = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            const validationError = validateDocument(file);
            if (validationError) {
                update(i, {done: true, error: validationError});
                continue;
            }

            try {
                const {uploadUrl, fileKey} = await generateUploadUrl({
                    type: "DOCUMENT",
                    fileName: file.name,
                    contentType: file.type,
                });

                await uploadFileWithProgress(uploadUrl, file, (pct) =>
                    update(i, {progress: pct})
                );

                update(i, {progress: 100, done: true});
                results.push({fileKey, fileName: file.name, fileSize: file.size, fileType: file.type});
            } catch {
                update(i, {done: true, error: "Upload failed"});
            }
        }

        if (results.length > 0) {
            onUploadComplete?.(results);
        }

        setTimeout(() => setQueue([]), 2500);
    };

    return (
        <div className="teacher-resource-uploader">
            {queue.length > 0 && (
                <ul className="teacher-resource-queue">
                    {queue.map((item, i) => (
                        <li key={i} className={`teacher-resource-queue__item${item.error ? " --error" : item.done ? " --done" : ""}`}>
                            {item.done ? (
                                item.error
                                    ? <XCircle size={12}/>
                                    : <CheckCircle size={12}/>
                            ) : null}
                            <span className="teacher-resource-queue__name" title={item.name}>
                                {item.name}
                            </span>
                            {!item.done && (
                                <div className="teacher-upload-progress-bar teacher-upload-progress-bar--sm">
                                    <div
                                        className="teacher-upload-progress-bar__fill"
                                        style={{width: `${item.progress}%`}}
                                    />
                                </div>
                            )}
                            {item.error && (
                                <span className="teacher-resource-queue__error">{item.error}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload lesson resources"
            >
                <FileUp size={16}/>
            </button>
            <input ref={fileInputRef} type="file" multiple onChange={handleFileChange}/>
        </div>
    );
};

export default ResourceUploader;
