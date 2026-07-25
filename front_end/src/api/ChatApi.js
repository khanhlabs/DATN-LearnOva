import axiosClient from "./AxiosClient.js";

export const sendChatMessageApi = async (messages) => {
  const response = await axiosClient.post("/chatbot/message", { messages });
  return response.data;
};

// Streams the bot's reply token-by-token via SSE instead of waiting for the
// full response. Uses fetch() directly (not axios) since we need to read the
// response body as a stream.
export const streamChatMessageApi = async (messages, { onChunk, onDone, onError }) => {
  const fallbackErrorMessage = "Không thể kết nối tới trợ lý AI lúc này. Vui lòng thử lại sau.";

  try {
    const response = await fetch(`${axiosClient.defaults.baseURL}/chatbot/message/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ messages }),
    });

    if (!response.ok || !response.body) {
      let errorMessage = fallbackErrorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorMessage;
      } catch {
        // response body wasn't JSON — keep the fallback message
      }
      onError?.(errorMessage);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const rawEvents = buffer.split("\n\n");
      buffer = rawEvents.pop() ?? "";

      for (const rawEvent of rawEvents) {
        let eventName = "message";
        const dataLines = [];

        for (const line of rawEvent.split("\n")) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            // Không trim() ở đây: nội dung token từ Groq có thể chính là dấu
            // cách (vd. giữa 2 từ), trim sẽ nuốt mất khoảng trắng đó và làm
            // các từ dính liền nhau khi ghép chuỗi.
            dataLines.push(line.slice(5));
          }
        }

        const data = dataLines.join("\n");

        if (eventName === "done") {
          onDone?.();
          return;
        }
        if (eventName === "error") {
          onError?.(data.trim() || fallbackErrorMessage);
          return;
        }
        if (eventName === "chunk" && data.length > 0) {
          onChunk?.(data);
        }
      }
    }

    onDone?.();
  } catch (err) {
    onError?.(err?.message || fallbackErrorMessage);
  }
};
