import {
  createConversation,
  createUserMessageWithConversationUpdate,
  findConversationByUserId,
  findMessageById,
  findMessagesAfterId,
  findMessagesByConversationId,
  markConversationReadById,
} from "../repositories/chatRepository.js";

const assertUserId = (userId) => {
  if (!Number.isInteger(userId) || userId <= 0) {
    const error = new Error("用户身份无效");
    error.statusCode = 401;
    throw error;
  }
};

const normalizeConversation = (conversation) => {
  return {
    conversationId: conversation.conversationId,
    status: conversation.status === "open" ? "active" : conversation.status,
    unreadCount: conversation.unreadCount,
  };
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

const getOrCreateConversation = async (userId) => {
  assertUserId(userId);
  return (await findConversationByUserId(userId)) ?? createConversation(userId);
};

export const getCurrentConversation = async (userId) => {
  return normalizeConversation(await getOrCreateConversation(userId));
};

export const getCurrentMessages = async (userId) => {
  const conversation = await getOrCreateConversation(userId);
  return findMessagesByConversationId(conversation.conversationId);
};

export const sendUserMessage = async (userId, content) => {
  const messageContent = typeof content === "string" ? content.trim() : "";

  if (!messageContent) {
    const error = new Error("消息内容不能为空");
    error.statusCode = 400;
    throw error;
  }

  const conversation = await getOrCreateConversation(userId);
  const result = await createUserMessageWithConversationUpdate(conversation.conversationId, messageContent);
  const message = await findMessageById(result.insertId);

  return {
    ...message,
    conversationId: conversation.conversationId,
  };
};

export const getLatestMessages = async (userId, lastMessageIdParam) => {
  const lastMessageId = parseLastMessageId(lastMessageIdParam);
  const conversation = await getOrCreateConversation(userId);
  return findMessagesAfterId(conversation.conversationId, lastMessageId);
};

export const markCurrentConversationRead = async (userId) => {
  const conversation = await getOrCreateConversation(userId);
  await markConversationReadById(conversation.conversationId);

  return {
    conversationId: conversation.conversationId,
    unreadCount: 0,
  };
};
