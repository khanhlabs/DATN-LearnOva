import asyncio
import os
import tempfile

from dotenv import load_dotenv
from fastapi.concurrency import run_in_threadpool
from fastapi import FastAPI, UploadFile, File, HTTPException

load_dotenv()

from services.gemini_summary_service import summarize_video
from services.gemini_quiz_service import generate_quiz

app = FastAPI(title="LearnOva AI Service", version="1.0.0")
# Gemini video processing is memory intensive. Serializing it prevents a small
# container from intermittently failing when quiz and summary requests overlap.
generation_semaphore = asyncio.Semaphore(1)


async def _save_upload_to_temp(file: UploadFile) -> str:
    suffix = os.path.splitext(file.filename or "")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        return tmp.name


@app.get("/health")
def health():
    return {
        "status": "ok"
    }

@app.post("/summarize")
async def summarize(file: UploadFile = File(...)):
    tmp_path = await _save_upload_to_temp(file)

    try:
        async with generation_semaphore:
            summary = await run_in_threadpool(summarize_video, tmp_path)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    finally:
        os.remove(tmp_path)

    return {"summary": summary}

@app.post("/generate-quiz")
async def generate_quiz_endpoint(file: UploadFile = File(...)):
    tmp_path = await _save_upload_to_temp(file)

    try:
        async with generation_semaphore:
            quiz = await run_in_threadpool(generate_quiz, tmp_path)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    finally:
        os.remove(tmp_path)

    return quiz
