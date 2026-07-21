<template>
  <FunctionHeader title="村委会" />

  <main class="village-chat-page">
    <section class="service-status" aria-label="村委会服务状态">
      <div>
        <p class="status-label">村委会在线咨询</p>
        <h1>有事可以先留言</h1>
        <p class="status-desc">工作时间：周一至周五 08:30-17:30</p>
      </div>
      <span class="online-badge">在线</span>
    </section>

    <section class="chat-panel" aria-label="村委会咨询消息">
      <div v-if="isLoading" class="chat-state">聊天记录加载中...</div>
      <div v-else-if="loadError" class="chat-state error">{{ loadError }}</div>
      <div v-else-if="messages.length === 0" class="chat-state">
        暂无聊天记录，可以先留言咨询
      </div>

      <template v-else>
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-row"
          :class="message.role"
        >
          <div class="avatar" aria-hidden="true">
            {{ message.role === "committee" ? "村" : "我" }}
          </div>
          <div class="message-content">
            <div class="message-meta">
              <span>{{ message.role === "committee" ? "村委工作人员" : "我" }}</span>
              <time>{{ message.time }}</time>
            </div>
            <p class="message-bubble">{{ message.content }}</p>
          </div>
        </div>
      </template>

      <div ref="bottomAnchor"></div>
    </section>
  </main>

  <footer class="chat-input-bar">
    <input
      v-model="messageText"
      class="message-input"
      type="text"
      placeholder="请输入要咨询的内容"
      :disabled="isSending"
      @keyup.enter="handleSendMessage"
    />
    <button
      class="send-button"
      type="button"
      :disabled="isSending"
      @click="handleSendMessage"
    >
      {{ isSending ? "发送中" : "发送" }}
    </button>
  </footer>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { showNotify } from "vant";
import {
  getVillageConversation,
  getVillageLatestMessages,
  getVillageMessages,
  markVillageChatRead,
  sendVillageMessage,
  type VillageMessage,
} from "@/api/modules/villageChat";
import FunctionHeader from "@/components/layout/FunctionHeader.vue";

interface ChatMessage {
  id: number;
  role: "committee" | "user";
  content: string;
  time: string;
}

const POLL_INTERVAL = 3000;

const messageText = ref("");
const bottomAnchor = ref<HTMLDivElement | null>(null);
const messages = ref<ChatMessage[]>([]);
const lastMessageId = ref(0);
const isLoading = ref(false);
const isSending = ref(false);
const loadError = ref("");
const pollTimer = ref<number | null>(null);

const toDisplayTime = (value: string) => {
  if (!value) return "";
  return value.slice(11, 16) || value;
};

const toChatMessage = (message: VillageMessage): ChatMessage => {
  return {
    id: message.id,
    role: message.senderType === "admin" ? "committee" : "user",
    content: message.content,
    time: toDisplayTime(message.createdAt),
  };
};

const getMaxMessageId = (list: ChatMessage[]) => {
  if (list.length === 0) return 0;
  return Math.max(...list.map((item) => item.id));
};

// 使用 id 去重，避免轮询和发送后的刷新造成重复气泡。
const appendMessages = (list: VillageMessage[]) => {
  const existingIds = new Set(messages.value.map((item) => item.id));
  const newMessages = list
    .filter((item) => !existingIds.has(item.id))
    .map(toChatMessage);

  if (newMessages.length === 0) return false;

  messages.value.push(...newMessages);
  lastMessageId.value = Math.max(lastMessageId.value, getMaxMessageId(newMessages));
  return true;
};

// 消息变化后滚动到底部，保持移动端聊天阅读位置自然。
const scrollToBottom = async () => {
  await nextTick();
  bottomAnchor.value?.scrollIntoView({ behavior: "smooth" });
};

// 页面初始化必须先确保会话存在，再拉取全量历史消息。
const loadInitialChat = async () => {
  isLoading.value = true;
  loadError.value = "";

  try {
    await getVillageConversation();

    const response = await getVillageMessages();
    const list = Array.isArray(response.data) ? response.data : [];
    messages.value = list.map(toChatMessage);
    lastMessageId.value = getMaxMessageId(messages.value);

    try {
      await markVillageChatRead();
    } catch (error) {
      console.error("标记村委会消息已读失败:", error);
    }

    await scrollToBottom();
  } catch (error) {
    console.error("加载村委会聊天失败:", error);
    loadError.value = "聊天记录加载失败，请稍后重试";
  } finally {
    isLoading.value = false;
  }
};

// 增量接口只能传 lastMessageId，不能在这里降级拉取全量，避免重复消息。
const pollLatestMessages = async () => {
  try {
    const response = await getVillageLatestMessages(lastMessageId.value);
    const list = Array.isArray(response.data) ? response.data : [];
    const hasNewMessages = appendMessages(list);

    if (hasNewMessages) {
      await scrollToBottom();
    }
  } catch (error) {
    console.error("轮询村委会新消息失败:", error);
  }
};

const startPolling = () => {
  stopPolling();
  pollTimer.value = window.setInterval(pollLatestMessages, POLL_INTERVAL);
};

const stopPolling = () => {
  if (pollTimer.value === null) return;
  window.clearInterval(pollTimer.value);
  pollTimer.value = null;
};

const handleSendMessage = async () => {
  const content = messageText.value.trim();

  if (!content || isSending.value) {
    return;
  }

  isSending.value = true;

  try {
    const response = await sendVillageMessage(content);
    messageText.value = "";

    if (response.data?.id) {
      appendMessages([response.data]);
      await scrollToBottom();
    }
  } catch (error) {
    console.error("发送村委会消息失败:", error);
    showNotify({ type: "danger", message: "发送失败，请稍后重试", position: "top" });
  } finally {
    isSending.value = false;
  }
};

onMounted(async () => {
  await loadInitialChat();
  startPolling();
});

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<style scoped lang="scss">
.village-chat-page {
  min-height: calc(100dvh - 46px);
  box-sizing: border-box;
  padding: 12px 10px calc(86px + env(safe-area-inset-bottom));
  background-color: #f0f8ff;
  color: #1f2933;
}

.service-status {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border-radius: 18px;
  padding: 16px;
  background-color: #fff;
  box-shadow: 0 8px 20px rgba(20, 135, 236, 0.1);

  h1 {
    margin: 6px 0 0;
    color: #0d5798;
    font-size: 28px;
    line-height: 1.3;
    font-weight: 800;
  }
}

.status-label,
.status-desc {
  margin: 0;
  line-height: 1.5;
}

.status-label {
  color: #2c77ad;
  font-size: 16px;
  font-weight: 700;
}

.status-desc {
  margin-top: 6px;
  color: #536b7a;
  font-size: 16px;
}

.online-badge {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 6px 12px;
  background-color: #e7f8f0;
  color: #138a61;
  font-size: 15px;
  line-height: 1.2;
  font-weight: 800;
}

.chat-panel {
  margin-top: 12px;
  border-radius: 18px;
  padding: 14px 10px;
  background-color: rgba(255, 255, 255, 0.72);
}

.chat-state {
  padding: 28px 12px;
  color: #678091;
  font-size: 16px;
  line-height: 1.5;
  text-align: center;

  &.error {
    color: #d94b42;
  }
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 14px;

  &:first-child {
    margin-top: 0;
  }

  &.user {
    flex-direction: row-reverse;

    .message-content {
      align-items: flex-end;
    }

    .message-meta {
      justify-content: flex-end;
    }

    .message-bubble {
      background-color: #1487ec;
      color: #fff;
      border-top-right-radius: 4px;
    }

    .avatar {
      background-color: #eaf3ff;
      color: #0d5798;
    }
  }

  &.committee {
    .message-bubble {
      background-color: #fff;
      color: #243746;
      border-top-left-radius: 4px;
    }

    .avatar {
      background-color: #e7f8f0;
      color: #138a61;
    }
  }
}

.avatar {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  font-size: 19px;
  line-height: 1;
  font-weight: 800;
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: calc(100% - 64px);
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
  color: #678091;
  font-size: 13px;
  line-height: 1.3;
}

.message-bubble {
  margin: 0;
  border-radius: 16px;
  padding: 12px 14px;
  font-size: 18px;
  line-height: 1.6;
  box-shadow: 0 5px 14px rgba(20, 135, 236, 0.08);
  overflow-wrap: anywhere;
}

.chat-input-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 12;
  display: flex;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background-color: rgba(240, 248, 255, 0.94);
  backdrop-filter: blur(10px);
}

.message-input {
  min-width: 0;
  flex: 1;
  height: 48px;
  box-sizing: border-box;
  border: 1px solid rgba(20, 135, 236, 0.18);
  border-radius: 999px;
  padding: 0 16px;
  background-color: #fff;
  color: #1f2933;
  font-size: 17px;
  outline: none;

  &::placeholder {
    color: #8aa0af;
  }

  &:focus {
    border-color: #1487ec;
    box-shadow: 0 0 0 3px rgba(20, 135, 236, 0.1);
  }

  &:disabled {
    color: #8aa0af;
    cursor: not-allowed;
  }
}

.send-button {
  flex: 0 0 auto;
  min-width: 76px;
  height: 48px;
  border: 0;
  border-radius: 999px;
  background-color: #1487ec;
  color: #fff;
  font-size: 18px;
  line-height: 1;
  font-weight: 800;

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    background-color: #8dbfe9;
    cursor: not-allowed;
  }
}

@media (max-width: 360px) {
  .service-status h1 {
    font-size: 25px;
  }

  .message-bubble {
    font-size: 17px;
  }

  .send-button {
    min-width: 68px;
  }
}
</style>
