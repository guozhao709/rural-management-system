<template>
  <main class="agent-page">
    <section class="agent-toolbar" aria-label="AI 工具栏">
      <div>
        <h1>智乡云 AI 助手</h1>
        <p>农业、健康、天气问题都可以直接问我</p>
      </div>
      <van-button
        size="small"
        plain
        type="primary"
        :disabled="messages.length === 0 || isStreaming"
        @click="clearMessages"
      >
        清空
      </van-button>
    </section>

    <section
      ref="messageListRef"
      class="message-list"
      :class="{ dragging: isMessageListDragging }"
      aria-label="AI 聊天消息"
      @pointerdown="handleMessageListPointerDown"
      @pointermove="handleMessageListPointerMove"
      @pointerup="handleMessageListPointerEnd"
      @pointerleave="handleMessageListPointerEnd"
      @pointercancel="handleMessageListPointerEnd"
      @lostpointercapture="handleMessageListPointerEnd"
    >
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">AI</div>
        <h2>有什么想问的？</h2>
        <p>可以试试：玉米叶子发黄怎么办、慢性荨麻疹怎么控制、明天西安天气。</p>
      </div>

      <article
        v-for="message in messages"
        :key="message.id"
        class="message-item"
        :class="`role-${message.role}`"
      >
        <van-image
          class="avatar"
          :src="message.role === 'user' ? userAvatar : aiAvatar"
          round
          width="38"
          height="38"
        />
        <div class="bubble">
          <p v-if="message.content" class="message-content">{{ message.content }}</p>
          <p v-else class="message-content loading-text">正在思考...</p>
          <span v-if="message.status === 'error'" class="error-text">发送失败</span>
        </div>
      </article>

      <div ref="bottomAnchorRef"></div>
    </section>

    <section class="input-area" aria-label="AI 输入区">
      <van-cell-group v-if="inputMode === 'text'" inset>
        <van-field
          v-model="userInput"
          autosize
          clearable
          type="textarea"
          rows="1"
          maxlength="500"
          placeholder="输入你想咨询的问题"
          :disabled="isStreaming"
          @keydown.enter.exact.prevent="sendMessage"
        >
          <template #button>
            <div class="input-actions">
              <van-button
                size="small"
                plain
                type="primary"
                :disabled="!isSpeechRecognitionSupported || isStreaming"
                @click="switchToVoiceInput"
              >
                语音
              </van-button>
              <van-button
                size="small"
                type="primary"
                :loading="isStreaming"
                :disabled="!userInput.trim()"
                @click="sendMessage"
              >
                发送
              </van-button>
            </div>
          </template>
        </van-field>
      </van-cell-group>

      <div v-else class="voice-panel">
        <van-button size="small" plain type="primary" @click="switchToTextInput">
          键盘
        </van-button>
        <button
          class="voice-hold-button"
          :class="{ recognizing: isRecognizing }"
          type="button"
          @pointerdown="handleVoicePressStart"
          @pointerup="handleVoicePressEnd"
          @pointercancel="handleVoicePressEnd"
          @lostpointercapture="handleVoicePressEnd"
          @contextmenu.prevent
        >
          {{ isRecognizing ? "松开发送到输入框" : "按住说话" }}
        </button>
      </div>

      <p v-if="speechNotice" class="speech-notice">{{ speechNotice }}</p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { showNotify } from "vant";
import { requestAgentStream } from "@/api/modules/agent";
import userAvatar from "../../../public/image/userAvatar.png";
import aiAvatar from "../../../public/image/aiAvatar.png";

type MessageRole = "user" | "assistant";
type MessageStatus = "streaming" | "done" | "error";
type InputMode = "text" | "voice";

interface AgentMessage {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  createdAt: string;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const userInput = ref("");
const messages = ref<AgentMessage[]>([]);
const inputMode = ref<InputMode>("text");
const isRecognizing = ref(false);
const isMessageListDragging = ref(false);
const speechNotice = ref("");
const messageListRef = ref<HTMLElement | null>(null);
const bottomAnchorRef = ref<HTMLDivElement | null>(null);

const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
const currentUserId = String(userInfo.id || "anonymous");
const storageKey = `agent_chat_messages:${currentUserId}`;

let messageSeed = Date.now();
let abortController: AbortController | null = null;
let recognition: SpeechRecognition | null = null;
let finalTranscript = "";
let latestInterimTranscript = "";
let dragStartY = 0;
let dragStartScrollTop = 0;
let activeMessageListPointerId: number | null = null;

const SpeechRecognitionClass =
  typeof window !== "undefined"
    ? (window as SpeechRecognitionWindow).SpeechRecognition ||
      (window as SpeechRecognitionWindow).webkitSpeechRecognition
    : undefined;

const isSpeechRecognitionSupported = Boolean(SpeechRecognitionClass);
const isStreaming = computed(() => messages.value.some((item) => item.status === "streaming"));

const createMessageId = () => {
  messageSeed += 1;
  return `${Date.now()}-${messageSeed}`;
};

const scrollToBottom = async () => {
  await nextTick();
  bottomAnchorRef.value?.scrollIntoView({ behavior: "smooth", block: "end" });
};

const handleMessageListPointerDown = (event: PointerEvent) => {
  if (event.pointerType !== "mouse" || event.button !== 0 || !messageListRef.value) {
    return;
  }

  activeMessageListPointerId = event.pointerId;
  dragStartY = event.clientY;
  dragStartScrollTop = messageListRef.value.scrollTop;
  isMessageListDragging.value = true;
  messageListRef.value.setPointerCapture?.(event.pointerId);
  event.preventDefault();
};

const handleMessageListPointerMove = (event: PointerEvent) => {
  if (
    !isMessageListDragging.value ||
    activeMessageListPointerId !== event.pointerId ||
    !messageListRef.value
  ) {
    return;
  }

  messageListRef.value.scrollTop = dragStartScrollTop - (event.clientY - dragStartY);
  event.preventDefault();
};

const handleMessageListPointerEnd = (event: PointerEvent) => {
  if (activeMessageListPointerId !== event.pointerId) {
    return;
  }

  if (messageListRef.value?.hasPointerCapture?.(event.pointerId)) {
    messageListRef.value.releasePointerCapture(event.pointerId);
  }

  activeMessageListPointerId = null;
  isMessageListDragging.value = false;
};

const saveMessages = () => {
  localStorage.setItem(storageKey, JSON.stringify(messages.value));
};

const loadMessages = () => {
  try {
    const storedMessages = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(storedMessages)) {
      messages.value = storedMessages.filter((item) => {
        return item && (item.role === "user" || item.role === "assistant");
      });
    }
  } catch {
    messages.value = [];
  }
};

const markAssistantMessage = (messageId: string, status: MessageStatus) => {
  const target = messages.value.find((item) => item.id === messageId);
  if (target) {
    target.status = status;
  }
};

const appendAssistantContent = (messageId: string, content: string) => {
  const target = messages.value.find((item) => item.id === messageId);
  if (target) {
    target.content += content;
  }
};

const sendMessage = async () => {
  const text = userInput.value.trim();

  if (!text || isStreaming.value) {
    return;
  }

  abortController?.abort();
  abortController = new AbortController();

  const assistantMessageId = createMessageId();
  const now = new Date().toISOString();

  messages.value.push(
    {
      id: createMessageId(),
      role: "user",
      content: text,
      status: "done",
      createdAt: now,
    },
    {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      status: "streaming",
      createdAt: now,
    },
  );

  userInput.value = "";
  speechNotice.value = "";
  await scrollToBottom();

  try {
    await requestAgentStream(text, {
      signal: abortController.signal,
      onContent: (content) => {
        appendAssistantContent(assistantMessageId, content);
        scrollToBottom();
      },
      onDone: () => {
        markAssistantMessage(assistantMessageId, "done");
      },
      onError: (message) => {
        markAssistantMessage(assistantMessageId, "error");
        showNotify({ type: "danger", message, position: "top" });
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }

    markAssistantMessage(assistantMessageId, "error");
    showNotify({
      type: "danger",
      message: error instanceof Error ? error.message : "发送失败，请稍后重试",
      position: "top",
    });
  } finally {
    abortController = null;
  }
};

const clearMessages = () => {
  if (isStreaming.value) {
    return;
  }

  messages.value = [];
  localStorage.removeItem(storageKey);
};

const appendTranscriptToInput = (transcript: string) => {
  const text = transcript.trim();

  if (!text) {
    return;
  }

  userInput.value = `${userInput.value}${text}`;
};

const switchToVoiceInput = () => {
  if (!isSpeechRecognitionSupported) {
    speechNotice.value = "当前浏览器不支持语音输入";
    return;
  }

  speechNotice.value = "";
  inputMode.value = "voice";
};

const switchToTextInput = () => {
  stopVoiceInput();
  inputMode.value = "text";
};

const createRecognition = () => {
  if (!SpeechRecognitionClass) {
    return null;
  }

  const nextRecognition = new SpeechRecognitionClass();
  nextRecognition.lang = "zh-CN";
  nextRecognition.continuous = false;
  nextRecognition.interimResults = true;
  nextRecognition.onresult = (event) => {
    let interimTranscript = "";

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const transcript = result?.[0]?.transcript || "";

      if (result?.isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    latestInterimTranscript = interimTranscript;
    speechNotice.value = interimTranscript
      ? `正在识别：${interimTranscript}`
      : "正在识别，请说话";
  };
  nextRecognition.onerror = (event) => {
    speechNotice.value =
      event.error === "not-allowed"
        ? "麦克风权限被拒绝，请允许后再试"
        : "语音识别失败，请重新长按输入";
    isRecognizing.value = false;
    inputMode.value = "text";
  };
  nextRecognition.onend = () => {
    isRecognizing.value = false;
    appendTranscriptToInput(finalTranscript || latestInterimTranscript);
    finalTranscript = "";
    latestInterimTranscript = "";
    recognition = null;
    inputMode.value = "text";

    if (!speechNotice.value.startsWith("麦克风") && !speechNotice.value.startsWith("语音识别失败")) {
      speechNotice.value = userInput.value ? "识别完成，可修改后发送" : "未识别到内容";
    }
  };

  return nextRecognition;
};

const startVoiceInput = () => {
  if (!isSpeechRecognitionSupported || isRecognizing.value) {
    return;
  }

  speechNotice.value = "正在识别，请说话";
  finalTranscript = "";
  latestInterimTranscript = "";
  recognition = createRecognition();

  if (!recognition) {
    speechNotice.value = "当前浏览器不支持语音输入";
    inputMode.value = "text";
    return;
  }

  try {
    recognition.start();
    isRecognizing.value = true;
  } catch {
    speechNotice.value = "语音识别启动失败，请重新长按输入";
    isRecognizing.value = false;
    recognition = null;
    inputMode.value = "text";
  }
};

const stopVoiceInput = () => {
  if (!recognition) {
    return;
  }

  try {
    recognition.stop();
  } catch {
    isRecognizing.value = false;
    recognition = null;
    inputMode.value = "text";
  }
};

const handleVoicePressStart = (event: PointerEvent) => {
  const target = event.currentTarget;

  if (target instanceof HTMLElement) {
    target.setPointerCapture?.(event.pointerId);
  }

  startVoiceInput();
};

const handleVoicePressEnd = (event: PointerEvent) => {
  const target = event.currentTarget;

  if (target instanceof HTMLElement && target.hasPointerCapture?.(event.pointerId)) {
    target.releasePointerCapture(event.pointerId);
  }

  stopVoiceInput();
};

watch(
  messages,
  () => {
    saveMessages();
  },
  { deep: true },
);

onMounted(() => {
  loadMessages();
  scrollToBottom();
});

onBeforeUnmount(() => {
  abortController?.abort();
  activeMessageListPointerId = null;
  isMessageListDragging.value = false;
  if (recognition) {
    recognition.abort();
  }
});
</script>

<style scoped lang="scss">
.agent-page {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 96px);
  box-sizing: border-box;
  padding: 10px 10px calc(92px + env(safe-area-inset-bottom));
  overflow: hidden;
  background-color: #f0f8ff;
  color: #1f2933;
}

.agent-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 4px 10px;

  h1 {
    margin: 0;
    color: #0d5798;
    font-size: 24px;
    line-height: 1.35;
    font-weight: 800;
  }

  p {
    margin: 2px 0 0;
    color: #2c77ad;
    font-size: 14px;
    line-height: 1.4;
  }
}

.message-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  cursor: grab;
  border: 1px solid rgba(20, 135, 236, 0.08);
  border-radius: 8px;
  padding: 12px 8px;
  background-color: #e8f5ff;

  &.dragging {
    cursor: grabbing;
    user-select: none;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 56vh;
  text-align: center;

  h2 {
    margin: 12px 0 6px;
    color: #0d5798;
    font-size: 24px;
    line-height: 1.35;
    font-weight: 800;
  }

  p {
    max-width: 280px;
    margin: 0;
    color: #2c77ad;
    font-size: 16px;
    line-height: 1.6;
  }
}

.empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background-color: #1989fa;
  color: #fff;
  font-size: 22px;
  line-height: 1;
  font-weight: 800;
}

.message-item {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;

  &.role-user {
    flex-direction: row-reverse;

    .bubble {
      background-color: #daf5d3;
      color: #173b16;
    }
  }

  &.role-assistant {
    .bubble {
      background-color: #fff;
      color: #1f2933;
    }
  }
}

.avatar {
  flex: 0 0 auto;
  margin-top: 2px;
}

.bubble {
  max-width: calc(100% - 62px);
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 4px 10px rgba(20, 135, 236, 0.08);
}

.message-content {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 16px;
  line-height: 1.65;
}

.loading-text {
  color: #718096;
  font-style: italic;
}

.error-text {
  display: inline-block;
  margin-top: 6px;
  color: #d93026;
  font-size: 13px;
  line-height: 1.4;
}

.input-area {
  position: sticky;
  bottom: 0;
  z-index: 4;
  margin-top: 10px;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.voice-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 16px;
  padding: 10px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 4px 10px rgba(20, 135, 236, 0.08);
}

.voice-hold-button {
  flex: 1;
  min-height: 48px;
  border: 0;
  border-radius: 999px;
  background-color: #1989fa;
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  touch-action: none;
  user-select: none;

  &.recognizing {
    background-color: #07c160;
  }

  &:active {
    transform: scale(0.98);
  }
}

.speech-notice {
  margin: 6px 16px 0;
  color: #2c77ad;
  font-size: 13px;
  line-height: 1.4;
}

@media (max-width: 360px) {
  .agent-toolbar {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;

    h1 {
      font-size: 22px;
    }
  }

  .message-content {
    font-size: 15px;
  }
}
</style>
