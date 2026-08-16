import axiosClient from "../../../../shared/api-client/AxiosClient";

export const createSupportConversationApi = async (payload, client = axiosClient) =>
  (await client.post("/support/conversations", payload)).data;

export const getMySupportConversationsApi = async (page = 0, size = 20, client = axiosClient) =>
  (await client.get("/support/conversations", { params: { page, size } })).data;

export const getSupportMessagesApi = async (conversationId, client = axiosClient) =>
  (await client.get(`/support/conversations/${conversationId}/messages`)).data;

export const sendSupportMessageApi = async (conversationId, payload, client = axiosClient) =>
  (await client.post(`/support/conversations/${conversationId}/messages`, payload)).data;

export const getAdminSupportConversationsApi = async (page = 0, size = 50, client = axiosClient) =>
  (await client.get("/support/admin/conversations", { params: { page, size } })).data;

export const getAdminSupportMessagesApi = async (conversationId, client = axiosClient) =>
  (await client.get(`/support/admin/conversations/${conversationId}/messages`)).data;

export const sendAdminSupportMessageApi = async (conversationId, payload, client = axiosClient) =>
  (await client.post(`/support/admin/conversations/${conversationId}/messages`, payload)).data;

export const updateSupportConversationStatusApi = async (conversationId, status, client = axiosClient) =>
  (await client.patch(`/support/admin/conversations/${conversationId}/status`, { status })).data;
