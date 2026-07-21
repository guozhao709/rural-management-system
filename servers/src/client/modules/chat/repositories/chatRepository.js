import { execute, query, queryOne, transaction } from "../../../../common/db/index.js";

export const findConversationByUserId = async (userId) => {
  return queryOne(
    `
SELECT
  id AS conversationId,
  user_id AS userId,
  status,
  unread_count AS unreadCount
FROM conversations
WHERE user_id = ?
ORDER BY id ASC
LIMIT 1
`,
    [userId],
  );
};

export const createConversation = async (userId) => {
  const result = await execute(
    `
INSERT INTO conversations (user_id, status)
VALUES (?, 'open')
`,
    [userId],
  );

  const conversation = await findConversationByUserId(userId);

  return conversation ?? {
    conversationId: result.insertId,
    userId,
    status: "open",
    unreadCount: 0,
  };
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

export const createUserMessageWithConversationUpdate = async (conversationId, content) => {
  return transaction(async (connection) => {
    const [result] = await connection.execute(
      `
INSERT INTO messages (conversation_id, sender_type, message_type, content)
VALUES (?, 'user', 'text', ?)
`,
      [conversationId, content],
    );

    await connection.execute(
      `
UPDATE conversations
SET
  last_message = ?,
  last_message_time = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP,
  unread_count = unread_count + 1,
  is_admin_read = 0
WHERE id = ?
`,
      [content, conversationId],
    );

    return result;
  });
};

export const findMessageById = async (messageId) => {
  return queryOne(
    `
SELECT
  id,
  sender_type AS senderType,
  content,
  created_at AS createdAt
FROM messages
WHERE id = ?
`,
    [messageId],
  );
};

export const markConversationReadById = async (conversationId) => {
  return execute(
    `
UPDATE conversations
SET
  unread_count = 0,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?
`,
    [conversationId],
  );
};
