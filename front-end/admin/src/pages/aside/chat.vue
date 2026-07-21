<template>
  <div class="container">
    <header class="chat-header">
      <div>总会话数：{{ totalConversations }}</div>
      <div>未处理：{{ pendingConversations }}</div>
      <div>已处理：{{ handledConversations }}</div>
    </header>

    <div class="chat-container">
      <aside class="chat-aside">
        <div v-if="loadingConversations" class="empty-state">会话加载中...</div>
        <div v-else-if="conversationList.length === 0" class="empty-state">暂无会话</div>
        <div
          v-for="item in conversationList"
          v-else
          :key="item.conversationId"
          class="chat-user"
          :class="{ active: item.conversationId === activeConversationId }"
          @click="handleSelectConversation(item)"
        >
          <div class="user-row">
            <div class="user-name">{{ item.username || `用户${item.userId}` }}</div>
            <span v-if="item.unreadCount > 0" class="unread-count">{{ item.unreadCount }}</span>
          </div>
          <div class="last-message">{{ item.lastMessage || "暂无消息" }}</div>
        </div>
      </aside>

      <main class="chat-main">
        <div ref="messageWindowRef" class="chat-main-window">
          <div v-if="loadingMessages" class="empty-state">消息加载中...</div>
          <div v-else-if="!activeConversationId" class="empty-state">请选择一个会话</div>
          <div v-else-if="messageList.length === 0" class="empty-state">暂无消息</div>

          <div
            v-for="message in messageList"
            v-else
            :key="message.id"
            class="message-row"
            :class="message.senderType === 'admin' ? 'right' : 'left'"
          >
            <template v-if="message.senderType !== 'admin'">
              <div class="avatar">对</div>
              <div class="bubble">
                <div class="bubble-content">{{ message.content }}</div>
              </div>
              <div class="time">{{ formatTime(message.createdAt) }}</div>
            </template>

            <template v-else>
              <div class="time">{{ formatTime(message.createdAt) }}</div>
              <div class="bubble">
                <div class="bubble-content">{{ message.content }}</div>
              </div>
              <div class="avatar me">我</div>
            </template>
          </div>
        </div>

        <footer class="chat-main-input">
          <input
            v-model="inputText"
            type="text"
            class="input-field"
            placeholder="请输入消息内容..."
            :disabled="!activeConversationId || sending"
            @keyup.enter="sendMessage"
          />
          <button
            class="send-btn"
            :disabled="!activeConversationId || sending"
            @click="sendMessage"
          >
            {{ sending ? "发送中" : "发送" }}
          </button>
        </footer>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import {
  getChatConversations,
  getChatMessages,
  getChatMessagesAfter,
  markChatConversationRead,
  sendChatMessage,
} from "@/api/index.js";

const POLL_INTERVAL = 3000;

const conversationList = ref([]);
const activeConversationId = ref(null);
const messageList = ref([]);
const lastMessageId = ref(0);
const inputText = ref("");
const loadingConversations = ref(false);
const loadingMessages = ref(false);
const sending = ref(false);
const pollTimer = ref(null);
const messageWindowRef = ref(null);

const totalConversations = computed(() => conversationList.value.length);
const pendingConversations = computed(() => {
  return conversationList.value.filter((item) => item.unreadCount > 0).length;
});
const handledConversations = computed(() => totalConversations.value - pendingConversations.value);

const formatTime = (value) => {
  if (!value) return "";
  return String(value).slice(11, 16) || String(value);
};

const getMaxMessageId = (list) => {
  if (list.length === 0) return 0;
  return Math.max(...list.map((item) => item.id));
};

// 页面只需要追加新消息；用 id 去重可以避免轮询和发送后的重复渲染。
const appendMessages = (list) => {
  const existingIds = new Set(messageList.value.map((item) => item.id));
  const newMessages = list.filter((item) => !existingIds.has(item.id));

  if (newMessages.length === 0) return;

  messageList.value.push(...newMessages);
  lastMessageId.value = Math.max(lastMessageId.value, getMaxMessageId(newMessages));
};

// 消息更新后滚动到底部，保持聊天窗口符合阅读习惯。
const scrollToBottom = async () => {
  await nextTick();
  const el = messageWindowRef.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
};

// 加载会话列表；刷新后保留当前选中的会话。
const loadConversations = async () => {
  loadingConversations.value = true;

  try {
    const res = await getChatConversations();
    conversationList.value = Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("获取会话列表失败:", error);
    conversationList.value = [];
  } finally {
    loadingConversations.value = false;
  }
};

// 切换会话时重新加载全量消息，避免旧会话轮询游标污染新会话。
const loadMessages = async (conversationId) => {
  loadingMessages.value = true;
  messageList.value = [];
  lastMessageId.value = 0;

  try {
    const res = await getChatMessages(conversationId);
    messageList.value = Array.isArray(res.data) ? res.data : [];
    lastMessageId.value = getMaxMessageId(messageList.value);
    await scrollToBottom();
  } catch (error) {
    console.error("获取会话消息失败:", error);
    messageList.value = [];
  } finally {
    loadingMessages.value = false;
  }
};

// 选中会话后立即标记已读，再刷新左侧未读数量。
const handleSelectConversation = async (conversation) => {
  if (!conversation?.conversationId) return;

  activeConversationId.value = conversation.conversationId;
  await loadMessages(conversation.conversationId);

  try {
    await markChatConversationRead(conversation.conversationId);
    await loadConversations();
  } catch (error) {
    console.error("标记会话已读失败:", error);
  }
};

// 轮询只拉取当前会话 lastMessageId 之后的消息，不自动标记已读。
const pollNewMessages = async () => {
  if (!activeConversationId.value || loadingMessages.value) return;

  try {
    const res = await getChatMessagesAfter(activeConversationId.value, lastMessageId.value);
    const list = Array.isArray(res.data?.list) ? res.data.list : [];
    appendMessages(list);

    if (typeof res.data?.latestMessageId === "number") {
      lastMessageId.value = Math.max(lastMessageId.value, res.data.latestMessageId);
    }

    if (list.length > 0) {
      await scrollToBottom();
      await loadConversations();
    }
  } catch (error) {
    console.error("轮询新消息失败:", error);
  }
};

const startPolling = () => {
  stopPolling();
  pollTimer.value = window.setInterval(pollNewMessages, POLL_INTERVAL);
};

const stopPolling = () => {
  if (!pollTimer.value) return;
  window.clearInterval(pollTimer.value);
  pollTimer.value = null;
};

// 发送成功后重新拉取当前会话，确保 createdAt 等后端字段完整。
const sendMessage = async () => {
  const content = inputText.value.trim();

  if (!content || !activeConversationId.value || sending.value) return;

  sending.value = true;

  try {
    const res = await sendChatMessage(activeConversationId.value, content);
    inputText.value = "";

    if (res.code === 200) {
      await loadMessages(activeConversationId.value);
    }

    await loadConversations();
  } catch (error) {
    console.error("发送消息失败:", error);
  } finally {
    sending.value = false;
  }
};

onMounted(async () => {
  await loadConversations();

  if (conversationList.value.length > 0) {
    await handleSelectConversation(conversationList.value[0]);
  }

  startPolling();
});

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<style scoped lang="scss">
.container {
  border: 1px solid #ccc;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .chat-header {
    height: 10%;
    flex-shrink: 0;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 200px;
    border-bottom: 1px solid #ccc;
  }

  .chat-container {
    display: flex;
    flex: 1;
    min-height: 0;

    .chat-aside {
      flex: 2;
      min-height: 0;
      background-color: #e0e0e0;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #ccc;
      overflow-y: auto;
      scrollbar-gutter: stable;
    }

    .empty-state {
      padding: 24px 16px;
      color: #888;
      font-size: 14px;
      text-align: center;
    }

    .chat-user {
      flex-shrink: 0;
      width: 100%;
      padding: 12px 16px;
      border-bottom: 1px solid #d4d4d4;
      cursor: pointer;
      box-sizing: border-box;

      &:hover,
      &.active {
        background-color: #d0d0d0;
      }

      .user-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 4px;
      }

      .user-name {
        min-width: 0;
        font-size: 14px;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .unread-count {
        flex-shrink: 0;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 9px;
        background-color: #f56c6c;
        color: #fff;
        font-size: 12px;
        line-height: 18px;
        text-align: center;
        box-sizing: border-box;
      }

      .last-message {
        font-size: 12px;
        color: #888;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .chat-main {
      flex: 8;
      min-height: 0;
      background-color: #f5f5f5;
      display: flex;
      flex-direction: column;

      .chat-main-window {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 16px 20px;
        box-sizing: border-box;
      }

      .message-row {
        display: flex;
        align-items: flex-start;
        margin-bottom: 20px;

        &.left {
          justify-content: flex-start;
        }

        &.right {
          justify-content: flex-end;
        }
      }

      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 4px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: #fff;
        background-color: #07c160;

        &.me {
          background-color: #1989fa;
        }
      }

      .bubble {
        max-width: 55%;
        margin: 0 10px;

        .bubble-content {
          font-size: 14px;
          line-height: 1.6;
          padding: 10px 14px;
          border-radius: 4px;
          word-break: break-word;
        }
      }

      .message-row.left {
        .bubble-content {
          background-color: #fff;
          color: #333;
          position: relative;

          &::before {
            content: "";
            position: absolute;
            left: -6px;
            top: 12px;
            width: 0;
            height: 0;
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
            border-right: 6px solid #fff;
          }
        }
      }

      .message-row.right {
        .bubble-content {
          background-color: #95ec69;
          color: #000;
          position: relative;

          &::after {
            content: "";
            position: absolute;
            right: -6px;
            top: 12px;
            width: 0;
            height: 0;
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
            border-left: 6px solid #95ec69;
          }
        }
      }

      .time {
        font-size: 11px;
        color: #b0b0b0;
        flex-shrink: 0;
        align-self: center;
        margin-top: 20px;
      }

      .chat-main-input {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background-color: #fff;
        border-top: 1px solid #e0e0e0;

        .input-field {
          flex: 1;
          height: 36px;
          padding: 0 12px;
          border: none;
          outline: none;
          font-size: 14px;
          background-color: #f5f5f5;
          border-radius: 4px;
          box-sizing: border-box;

          &:disabled {
            cursor: not-allowed;
            color: #aaa;
          }
        }

        .send-btn {
          flex-shrink: 0;
          margin-left: 12px;
          padding: 8px 20px;
          background-color: #07c160;
          color: #fff;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;

          &:hover {
            background-color: #06ad56;
          }

          &:active {
            background-color: #05964a;
          }

          &:disabled {
            cursor: not-allowed;
            background-color: #a8dabc;
          }
        }
      }
    }
  }
}
</style>
