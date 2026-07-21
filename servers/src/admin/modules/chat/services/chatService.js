import {
  createAdminMessageWithConversationUpdate,
  findConversationById,
  findConversations,
  findMessagesAfterId,
  findMessagesByConversationId,
  markConversationRead,
} from "../repositories/chatRepository.js";

const parseConversationId = (conversationId) => {
  const id = Number.parseInt(conversationId, 10);

  if (!Number.isInteger(id) || id <= 0 || String(id) !== String(conversationId)) {
    const error = new Error("conversationId 必须是正整数");
    error.statusCode = 400;
    throw error;
  }

  return id;
};

const assertConversationExists = async (conversationId) => {
  const conversation = await findConversationById(conversationId);

  if (!conversation) {
    const error = new Error("会话不存在");
    error.statusCode = 404;
    throw error;
  }

  return conversation;
};

const parseLastMessageId = (lastMessageId) => {
  const id = Number.parseInt(lastMessageId, 10);

  if (!Number.isInteger(id) || id < 0 || String(id) !== String(lastMessageId)) {
    const error = new Error("lastMessageId 必须是非负整数");
    error.statusCode = 400;
    throw error;
  }

  return id;
};

export const getConversationList = async () => {
  return findConversations();
};

export const getConversationMessages = async (conversationIdParam) => {
  const conversationId = parseConversationId(conversationIdParam);
  await assertConversationExists(conversationId);
  return findMessagesByConversationId(conversationId);
};

export const getMessagesAfter = async (conversationIdParam, lastMessageIdParam) => {
  const conversationId = parseConversationId(conversationIdParam);
  const lastMessageId = parseLastMessageId(lastMessageIdParam);
  await assertConversationExists(conversationId);

  const list = await findMessagesAfterId(conversationId, lastMessageId);
  const latestMessageId = list.length > 0 ? list[list.length - 1].id : lastMessageId;

  return {
    list,
    latestMessageId,
  };
};

export const sendAdminMessage = async (conversationIdParam, content) => {
  const conversationId = parseConversationId(conversationIdParam);
  const messageContent = typeof content === "string" ? content.trim() : "";

  if (!messageContent) {
    const error = new Error("消息内容不能为空");
    error.statusCode = 400;
    throw error;
  }

  await assertConversationExists(conversationId);
  const result = await createAdminMessageWithConversationUpdate(conversationId, messageContent);

  return {
    id: result.insertId,
    conversationId,
    senderType: "admin",
    content: messageContent,
  };
};

export const markAsRead = async (conversationIdParam) => {
  const conversationId = parseConversationId(conversationIdParam);
  await assertConversationExists(conversationId);
  await markConversationRead(conversationId);

  return {
    conversationId,
    unreadCount: 0,
    isAdminRead: 1,
  };
};
