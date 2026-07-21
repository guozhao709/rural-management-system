import { execute, query, queryOne, transaction } from "../../../../common/db/index.js";

export const findConversations = async () => {
  return query(
    `
SELECT
  c.id AS conversationId,
  c.user_id AS userId,
  COALESCE(u.name, '') AS username,
  c.last_message AS lastMessage,
  c.last_message_time AS lastMessageTime,
  c.unread_count AS unreadCount
FROM conversations c
LEFT JOIN users u ON u.id = c.user_id
ORDER BY
  COALESCE(c.last_message_time, c.created_at) DESC,
  c.created_at DESC
`,
  );
};

export const findConversationById = async (conversationId) => {
  return queryOne(
    `
SELECT
  id,
  user_id AS userId,
  status,
  unread_count AS unreadCount,
  is_admin_read AS isAdminRead
FROM conversations
WHERE id = ?
`,
    [conversationId],
  );
};

export const findMessagesByConversationId = async (conversationId) => {
  return query(
    `
SELECT
  id,
  sender_type AS senderType,
  content,
  created_at AS createdAt
FROM messages
WHERE conversation_id = ?
ORDER BY created_at ASC, id ASC
`,
    [conversationId],
  );
};

export const findMessagesAfterId = async (conversationId, lastMessageId) => {
  return query(
    `
SELECT
  id,
  sender_type AS senderType,
  content,
  created_at AS createdAt
FROM messages
WHERE conversation_id = ? AND id > ?
ORDER BY id ASC
`,
    [conversationId, lastMessageId],
  );
};

export const createAdminMessageWithConversationUpdate = async (conversationId, content) => {
  return transaction(async (connection) => {
    const [result] = await connection.execute(
      `
INSERT INTO messages (conversation_id, sender_type, message_type, content)
VALUES (?, 'admin', 'text', ?)
`,
      [conversationId, content],
    );

    await connection.execute(
      `
UPDATE conversations
SET
  last_message = ?,
  last_message_time = CURRENT_TIMESTAMP,
  is_admin_read = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?
`,
      [content, conversationId],
    );

    return result;
  });
};

export const markConversationRead = async (conversationId) => {
  return execute(
    `
UPDATE conversations
SET
  unread_count = 0,
  is_admin_read = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?
`,
    [conversationId],
  );
};
