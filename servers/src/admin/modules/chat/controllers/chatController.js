import {
  getConversationList,
  getConversationMessages,
  getMessagesAfter,
  markAsRead,
  sendAdminMessage,
} from "../services/chatService.js";

const sendSuccess = (res, data, message = "操作成功") => {
  res.json({
    code: 200,
    message,
    data,
  });
};

const sendError = (res, error) => {
  const code = error.statusCode || 500;

  res.status(code).json({
    code,
    message: code === 500 ? "服务端异常" : error.message,
    data: null,
  });
};

export const getConversations = async (req, res) => {
  try {
    sendSuccess(res, await getConversationList(), "获取成功");
  } catch (error) {
    sendError(res, error);
  }
};

export const getMessages = async (req, res) => {
  try {
    const data = await getConversationMessages(req.params.conversationId);
    sendSuccess(res, data, "获取成功");
  } catch (error) {
    sendError(res, error);
  }
};

export const getMessagesAfterLastId = async (req, res) => {
  try {
    const data = await getMessagesAfter(req.params.conversationId, req.query.lastMessageId);
    sendSuccess(res, data, "获取成功");
  } catch (error) {
    sendError(res, error);
  }
};

export const postMessage = async (req, res) => {
  try {
    const data = await sendAdminMessage(req.params.conversationId, req.body?.content);
    sendSuccess(res, data, "发送成功");
  } catch (error) {
    sendError(res, error);
  }
};

export const patchRead = async (req, res) => {
  try {
    const data = await markAsRead(req.params.conversationId);
    sendSuccess(res, data, "标记已读成功");
  } catch (error) {
    sendError(res, error);
  }
};
