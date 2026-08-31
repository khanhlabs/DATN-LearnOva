import json
import os
import time

from google import genai
from google.genai import types
from services.gemini_file_utils import (
    delete_file_safely,
    retry_transient,
    wait_for_file_ready,
)

_client = None

QUIZ_SCHEMA = {
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "options": {
                        "type": "array",
                        "items": {"type": "string"},
                        "minItems": 4,
                        "maxItems": 4,
                    },
                    "correctIndex": {"type": "integer"},
                },
                "required": ["question", "options", "correctIndex"],
            },
            "minItems": 5,
            "maxItems": 5,
        }
    },
    "required": ["questions"],
}

QUIZ_PROMPT = """
Tạo 5 câu hỏi trắc nghiệm bằng tiếng Việt dựa trên nội dung video bài giảng này.
Mỗi câu có đúng 4 lựa chọn, chỉ 1 đáp án đúng.
correctIndex là vị trí (0-3) của đáp án đúng trong mảng options.
Câu hỏi phải kiểm tra hiểu nội dung, không hỏi các chi tiết vụn vặt không quan trọng.
"""


def _get_client():
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        _client = genai.Client(api_key=api_key)
    return _client


def generate_quiz(file_path: str) -> dict:
    client = _get_client()
    uploaded_file = None

    try:
        uploaded_file = retry_transient(lambda: client.files.upload(file=file_path))
        uploaded_file = wait_for_file_ready(client, uploaded_file)
        response = retry_transient(
            lambda: client.models.generate_content(
                model="gemini-flash-latest",
                contents=[uploaded_file, QUIZ_PROMPT],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=QUIZ_SCHEMA,
                ),
            )
        )
        return json.loads(response.text)
    finally:
        delete_file_safely(client, uploaded_file)
