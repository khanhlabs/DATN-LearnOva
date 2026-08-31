import os
import time

from google import genai
from services.gemini_file_utils import (
    delete_file_safely,
    retry_transient,
    wait_for_file_ready,
)

_client = None


def _get_client():
    global _client
    if _client is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set")
        _client = genai.Client(api_key=api_key)
    return _client


SUMMARY_PROMPT = """
Bạn là hệ thống tóm tắt bài giảng.
Hãy tóm tắt nội dung video này bằng tiếng Việt, dạng gạch đầu dòng.

Yêu cầu:
- Ngắn gọn
- Chỉ nêu ý chính
- Không thêm văn bản thừa
"""


def summarize_video(file_path: str) -> str:
    client = _get_client()
    uploaded_file = None

    try:
        uploaded_file = retry_transient(lambda: client.files.upload(file=file_path))
        uploaded_file = wait_for_file_ready(client, uploaded_file)
        response = retry_transient(
            lambda: client.models.generate_content(
                model="gemini-flash-latest",
                contents=[uploaded_file, SUMMARY_PROMPT],
            )
        )
        if not response.text or not response.text.strip():
            raise RuntimeError("Gemini returned an empty summary")
        return response.text.strip()
    finally:
        delete_file_safely(client, uploaded_file)
