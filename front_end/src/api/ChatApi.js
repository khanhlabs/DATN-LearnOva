import axiosClient from "./AxiosClient.js";

export const sendChatMessageApi = async (messages) => {
  const response = await axiosClient.post("/chatbot/message", { messages });
  return response.data;
};
