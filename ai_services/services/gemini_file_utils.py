import os
import time
from collections.abc import Callable
from typing import TypeVar


T = TypeVar("T")
POLL_INTERVAL_SECONDS = 2
PROCESSING_TIMEOUT_SECONDS = int(os.getenv("GEMINI_FILE_TIMEOUT_SECONDS", "600"))
MAX_RETRIES = int(os.getenv("GEMINI_MAX_RETRIES", "3"))


def retry_transient(operation: Callable[[], T]) -> T:
    """Retries short-lived Gemini/network failures with exponential backoff."""
    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            return operation()
        except Exception as error:
            last_error = error
            message = str(error).lower()
            # Retrying configuration/authentication failures only delays the response.
            if "api_key" in message or "api key" in message or "permission" in message:
                raise
            if attempt == MAX_RETRIES - 1:
                raise
            time.sleep(2**attempt)
    raise RuntimeError("Gemini request failed") from last_error


def wait_for_file_ready(client, uploaded_file):
    deadline = time.monotonic() + PROCESSING_TIMEOUT_SECONDS

    while uploaded_file.state.name == "PROCESSING":
        if time.monotonic() >= deadline:
            raise TimeoutError("Gemini file processing timed out")
        time.sleep(POLL_INTERVAL_SECONDS)
        uploaded_file = retry_transient(
            lambda: client.files.get(name=uploaded_file.name)
        )

    if uploaded_file.state.name != "ACTIVE":
        raise RuntimeError(f"Gemini file processing failed: {uploaded_file.state}")
    return uploaded_file


def delete_file_safely(client, uploaded_file) -> None:
    if uploaded_file is None:
        return
    try:
        client.files.delete(name=uploaded_file.name)
    except Exception:
        # Cleanup failure must not mask an otherwise useful AI response.
        pass
