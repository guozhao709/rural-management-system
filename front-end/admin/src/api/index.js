import request from "@/utils/request";

// Login
export const login = (data) => {
  return request.post("api/v1/admin/auth/login", data);
};

// Register
export const register = (data) => {
  return request.post("api/v1/admin/auth/register", data);
};

// Admin list
export const getAdminList = () => {
  return request.get("api/v1/admin/administrator/lists");
};

// Delete admin
export const deleteAdmin = (data) => {
  return request.delete(`api/v1/admin/administrator/${data.adminID}`);
};

// Update admin
export const updateAdmin = (data) => {
  return request.put(`api/v1/admin/administrator/${data.adminID}`, data);
};

// Villager list
export const getVillagersList = (params) => {
  return request.get("api/v1/admin/villagers/lists", { params });
};

// Delete villager
export const deleteVillager = (id) => {
  return request.delete(`api/v1/admin/villagers/${id}`);
};

// Update villager
export const updateVillager = (data) => {
  return request.put(`api/v1/admin/villagers/${data.id}`, data);
};

// Chat conversation list
export const getChatConversations = () => {
  return request.get("/admin/chat/conversations");
};

// Full message list for one conversation
export const getChatMessages = (conversationId) => {
  return request.get(`/admin/chat/conversations/${conversationId}/messages`);
};

// Poll messages after lastMessageId
export const getChatMessagesAfter = (conversationId, lastMessageId) => {
  return request.get(`/admin/chat/conversations/${conversationId}/messages/after`, {
    params: {
      lastMessageId,
    },
  });
};

// Send admin message
export const sendChatMessage = (conversationId, content) => {
  return request.post(`/admin/chat/conversations/${conversationId}/messages`, {
    content,
  });
};

// Mark conversation as read
export const markChatConversationRead = (conversationId) => {
  return request.patch(`/admin/chat/conversations/${conversationId}/read`);
};

// ========== Article management ==========

// Article list (paginated, with filters)
export const getArticleList = (params) => {
  return request.get("api/v1/admin/articles", { params });
};

// Article detail
export const getArticleDetail = (id) => {
  return request.get(`api/v1/admin/articles/${id}`);
};

// Create article
export const createArticle = (data) => {
  return request.post("api/v1/admin/articles", data);
};

// Update article
export const updateArticle = (id, data) => {
  return request.put(`api/v1/admin/articles/${id}`, data);
};

// Delete article
export const deleteArticle = (id) => {
  return request.delete(`api/v1/admin/articles/${id}`);
};
