import {
  getCurrentConversation,
  getCurrentMessages,
  getLatestMessages,
  markCurrentConversationRead,
  sendUserMessage,
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

export const getConversation = async (req, res) => {
  try {
    sendSuccess(res, await getCurrentConversation(req.user?.id), "获取成功");
  } catch (error) {
    sendError(res, error);
  }
};

export const getMessages = async (req, res) => {
  try {
    sendSuccess(res, await getCurrentMessages(req.user?.id), "获取成功");
  } catch (error) {
    sendError(res, error);
  }
};

export const postMessage = async (req, res) => {
  try {
    sendSuccess(res, await sendUserMessage(req.user?.id, req.body?.content), "发送成功");
  } catch (error) {
    sendError(res, error);
  }
};

export const getLatest = async (req, res) => {
  try {
    sendSuccess(res, await getLatestMessages(req.user?.id, req.query.lastMessageId), "获取成功");
  } catch (error) {
    sendError(res, error);
  }
};

export const patchRead = async (req, res) => {
  try {
    sendSuccess(res, await markCurrentConversationRead(req.user?.id), "标记已读成功");
  } catch (error) {
    sendError(res, error);
  }
};
