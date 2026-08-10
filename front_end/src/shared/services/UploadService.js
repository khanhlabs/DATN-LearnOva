export const uploadFileToS3 = async (uploadUrl, file) => {
    const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {"Content-Type": file.type},
        body: file,
    });
    if (!response.ok) throw new Error("Upload failed");
};

export const uploadFileWithProgress = (uploadUrl, file, onProgress) =>
    new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
    });
