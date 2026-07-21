<template>
  <div class="chat-container">
    <div v-if="messages.length === 0" class="welcome-placeholder">
      <span class="welcome-icon">🤖</span>
      <p>有什么可以帮您的？</p>
    </div>
    <div v-for="message in messages" :key="message.id" class="message-item">
      <div v-if="message.role === 'user'" class="user-message">
        <span class="message-pop">{{ message.content }}</span>
        <div class="avatar">
          <van-image
            src="../../../public/image/userAvatar.png"
            round
            width="45"
            height="45"
          >
          </van-image>
        </div>
      </div>
      <div v-else class="assistant-message">
        <div class="avatar">
          <van-image
            src="../../../public/image/aiAvatar.png"
            round
            width="45"
            height="45"
          >
          </van-image>
        </div>
        <span class="message-pop">
          <span v-if="message.content === ''" class="loading-text">加载中...</span>
          <template v-else>{{ message.content }}</template>
        </span>
      </div>
    </div>
    <div ref="bottomAnchor"></div>
  </div>

  <div class="chat-input-container">
    <van-cell-group v-if="inputMode === 'text'" inset>
      <van-field
        v-model="userPrompt"
        center
        clearable
        placeholder="有什么想问的?"
      >
        <template #button>
          <div class="input-actions">
            <van-button
              size="small"
              type="primary"
              plain
              :disabled="!isSpeechRecognitionSupported"
              @click="switchToVoiceInput"
            >
              语音
            </van-button>
            <van-button size="small" type="primary" @click="handleAIchat"
              >发送</van-button
            >
          </div>
        </template>
      </van-field>
    </van-cell-group>

    <div v-else class="voice-input-panel">
      <van-button size="small" type="primary" plain @click="switchToTextInput">
        键盘
      </van-button>
      <button
        class="voice-hold-button"
        :class="{ recognizing: isRecognizing }"
        type="button"
        @pointerdown="startVoiceInput"
        @pointerup="stopVoiceInput"
        @pointerleave="stopVoiceInput"
        @pointercancel="stopVoiceInput"
        @contextmenu.prevent
      >
        {{ isRecognizing ? "松开发送到输入框" : "按住说话" }}
      </button>
    </div>

    <p v-if="speechNotice" class="speech-notice">{{ speechNotice }}</p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { requestAIchatStream } from "@/api/modules/aiChat";

type InputMode = "text" | "voice";

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

const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
const userId = Number(userInfo.id);

console.log("在ai聊天界面的userId:", userId);

interface MessageRole {
  id: number;
  role: string;
  content: string;
}

const userPrompt = ref<string>("");
const inputMode = ref<InputMode>("text");
const isRecognizing = ref(false);
const speechNotice = ref("");

const SpeechRecognitionClass =
  typeof window !== "undefined"
    ? (window as SpeechRecognitionWindow).SpeechRecognition ||
      (window as SpeechRecognitionWindow).webkitSpeechRecognition
    : undefined;

const isSpeechRecognitionSupported = Boolean(SpeechRecognitionClass);
let recognition: SpeechRecognition | null = null;
let finalTranscript = "";
let latestInterimTranscript = "";

const handleAIchat = () => {
  const prompt = userPrompt.value.trim();

  if (!prompt) {
    return;
  }

  const length = messages.value.length;
  messages.value.push({
    id: length + 1,
    role: "user",
    content: prompt,
  });

  messages.value.push({
    id: length + 2,
    role: "assistant",
    content: "",
  });

  requestAIchatStream(userId, prompt, (str) => {
    if (messages.value[length + 1]) {
      messages.value[length + 1]!.content = str;
    }
  });

  userPrompt.value = "";

  // 滚动到最底部
  const bottomAnchor = ref<HTMLDivElement | null>(null);
  if (bottomAnchor.value) {
    bottomAnchor.value.scrollIntoView({ behavior: "smooth" });
  }
};

const messages = ref<MessageRole[]>([]);

const appendTranscriptToPrompt = (transcript: string) => {
  const text = transcript.trim();

  if (!text) {
    return;
  }

  userPrompt.value = `${userPrompt.value}${text}`;
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
      if (!result) {
        continue;
      }

      const transcript = result[0]?.transcript || "";

      if (result.isFinal) {
        finalTranscript += transcript;
        continue;
      }

      interimTranscript += transcript;
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
    appendTranscriptToPrompt(finalTranscript || latestInterimTranscript);
    finalTranscript = "";
    latestInterimTranscript = "";
    recognition = null;
    inputMode.value = "text";

    if (!speechNotice.value.startsWith("麦克风") && !speechNotice.value.startsWith("语音识别失败")) {
      speechNotice.value = userPrompt.value ? "识别完成，可修改后发送" : "未识别到内容";
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
  if (!recognition || !isRecognizing.value) {
    return;
  }

  recognition.stop();
};

onBeforeUnmount(() => {
  if (recognition) {
    recognition.abort();
  }
});
</script>

<style scoped lang="scss">
.chat-container {
  margin: 10px;
  padding: 10px;
  border: 2px solid #fff;
  border-radius: 10px;
  background-color: #cfd8f3;
  overflow-y: auto;
  height: 80vh;

  .welcome-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;

    .welcome-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    p {
      margin: 0;
      font-size: 22px;
      color: #666;
    }
  }

  .message-item {
    margin: 10px 0 0 0;
    font-size: 20px;

    // 消息容器的公共 flex 样式
    .user-message,
    .assistant-message {
      display: flex;
      align-items: flex-start;
    }

    // 用户消息：右对齐 + 左侧 margin
    .user-message {
      justify-content: flex-end;
      margin-left: 10%;

      .message-pop {
        margin-right: 10px;
        background-color: #35ec08;
      }
    }

    // 助手消息：左对齐 + 右侧 margin
    .assistant-message {
      justify-content: flex-start;
      margin-right: 10%;

      .message-pop {
        margin-left: 10px;
        background-color: #fff;
      }

      .loading-text {
        color: #999;
        font-style: italic;
      }
    }
    // 气泡的公共样式
    .message-pop {
      padding: 10px;
      border-radius: 10px;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }
}

.chat-input-container {
  padding: 0 0 10px;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.voice-input-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 16px;
  padding: 10px;
  border-radius: 10px;
  background-color: #fff;
}

.voice-hold-button {
  flex: 1;
  min-height: 48px;
  border: 0;
  border-radius: 999px;
  background-color: #1989fa;
  color: #fff;
  font-size: 18px;
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
  color: #666;
  font-size: 13px;
  line-height: 1.4;
}
</style>
