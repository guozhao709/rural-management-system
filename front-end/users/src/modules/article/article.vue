<template>
  <main class="article-page">
    <section v-if="loading" class="article-shell">
      <p class="loading-text">加载中...</p>
    </section>

    <section v-else-if="article" class="article-shell">
      <header class="article-header">
        <button class="back-button" type="button" @click="handleBack">返回</button>
        <p class="article-label">服务专栏</p>
        <h1>{{ article.title }}</h1>
        <time>{{ article.date }}</time>
        <button
          class="speech-button"
          type="button"
          :disabled="!isSpeechSupported"
          @click="toggleSpeech"
        >
          {{ speechButtonText }}
        </button>
      </header>

      <article class="markdown-body" v-html="articleHtml"></article>
    </section>

    <section v-else class="empty-state">
      <h1>文章不存在</h1>
      <p>当前文章可能已经下架，或链接地址有误。</p>
      <button class="back-button primary" type="button" @click="handleBack">返回首页</button>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getArticleDetail } from "@/api/modules/article";

interface ArticleData {
  id: number;
  title: string;
  date: string;
  content: string;
}

const route = useRoute();
const router = useRouter();
const isSpeaking = ref(false);
const article = ref<ArticleData | null>(null);
const loading = ref(true);
const error = ref(false);

const isSpeechSupported =
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  "SpeechSynthesisUtterance" in window;

const fetchArticle = async (id: string) => {
  loading.value = true;
  error.value = false;
  try {
    const res = await getArticleDetail(id);
    if (res.code === 200 && res.data) {
      article.value = {
        id: res.data.id,
        title: res.data.title,
        date: res.data.createTime,
        content: res.data.content,
      };
    } else {
      article.value = null;
      error.value = true;
    }
  } catch (err) {
    console.error("获取文章详情失败:", err);
    article.value = null;
    error.value = true;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;
  fetchArticle(id as string);
});

watch(
  () => route.params.id,
  (newId) => {
    stopSpeech();
    const id = Array.isArray(newId) ? newId[0] : newId;
    fetchArticle(id as string);
  },
);

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const renderInlineMarkdown = (value: string) => {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
};

const renderMarkdown = (markdown: string) => {
  const blocks: string[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length) {
      blocks.push(`<ul>${listItems.join("")}</ul>`);
      listItems = [];
    }
  };

  markdown.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    if (line.startsWith("### ")) {
      flushList();
      blocks.push(`<h3>${renderInlineMarkdown(line.slice(4))}</h3>`);
      return;
    }

    if (line.startsWith("## ")) {
      flushList();
      blocks.push(`<h2>${renderInlineMarkdown(line.slice(3))}</h2>`);
      return;
    }

    if (line.startsWith("# ")) {
      flushList();
      blocks.push(`<h1>${renderInlineMarkdown(line.slice(2))}</h1>`);
      return;
    }

    if (line.startsWith("- ")) {
      listItems.push(`<li>${renderInlineMarkdown(line.slice(2))}</li>`);
      return;
    }

    flushList();
    blocks.push(`<p>${renderInlineMarkdown(line)}</p>`);
  });

  flushList();
  return blocks.join("");
};

const articleHtml = computed(() => {
  return article.value ? renderMarkdown(article.value.content) : "";
});

const cleanMarkdownForSpeech = (markdown: string) => {
  return markdown
    .split(/\r?\n/)
    .map((line) =>
      line
        .trim()
        .replace(/^#{1,6}\s+/, "")
        .replace(/^-\s+/, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/`(.+?)`/g, "$1"),
    )
    .filter(Boolean);
};

const speechText = computed(() => {
  if (!article.value) {
    return "";
  }

  const lines = cleanMarkdownForSpeech(article.value.content);

  if (lines[0] === article.value.title) {
    lines.shift();
  }

  return [article.value.title, ...lines].join("。");
});

const speechButtonText = computed(() => {
  if (!isSpeechSupported) {
    return "当前浏览器不支持语音播报";
  }

  return isSpeaking.value ? "停止播报" : "语音播报";
});

const stopSpeech = () => {
  if (isSpeechSupported) {
    window.speechSynthesis.cancel();
  }

  isSpeaking.value = false;
};

const toggleSpeech = () => {
  if (!isSpeechSupported || !speechText.value) {
    return;
  }

  if (isSpeaking.value) {
    stopSpeech();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(speechText.value);
  utterance.lang = "zh-CN";
  utterance.rate = 0.9;
  utterance.onend = () => {
    isSpeaking.value = false;
  };
  utterance.onerror = () => {
    isSpeaking.value = false;
  };

  window.speechSynthesis.speak(utterance);
  isSpeaking.value = true;
};

watch(article, () => {
  stopSpeech();
});

onBeforeUnmount(() => {
  stopSpeech();
});

const handleBack = () => {
  stopSpeech();

  if (window.history.length > 1) {
    router.back();
    return;
  }

  router.push("/home");
};
</script>

<style scoped lang="scss">
.article-page {
  min-height: 100dvh;
  box-sizing: border-box;
  padding: 12px 10px 28px;
  background-color: #f0f8ff;
}

.article-shell,
.empty-state {
  border-radius: 18px;
  padding: 18px 16px 24px;
  background-color: rgba(255, 255, 255, 0.86);
  box-shadow: 0 8px 20px rgba(20, 135, 236, 0.12);
}

.article-header {
  border-bottom: 2px dashed rgba(20, 135, 236, 0.24);
  padding-bottom: 16px;

  h1 {
    margin: 8px 0 10px;
    color: #0d5798;
    font-size: 34px;
    line-height: 1.3;
    font-weight: 800;
    overflow-wrap: anywhere;
  }

  time {
    color: #2c77ad;
    font-size: 20px;
    line-height: 1.4;
  }
}

.article-label {
  margin: 16px 0 0;
  color: #2c77ad;
  font-size: 20px;
  line-height: 1.4;
  font-weight: 700;
}

.back-button {
  min-height: 46px;
  border: 0;
  border-radius: 999px;
  padding: 0 22px;
  background-color: #bed9f0bd;
  color: #0d5798;
  font-size: 20px;
  line-height: 1;
  font-weight: 800;

  &.primary {
    background-color: #1487ecbd;
    color: #fff;
  }
}

.speech-button {
  display: block;
  width: 100%;
  min-height: 54px;
  box-sizing: border-box;
  border: 0;
  border-radius: 14px;
  margin-top: 16px;
  padding: 0 18px;
  background-color: #1487ecbd;
  color: #fff;
  font-size: 22px;
  line-height: 1.25;
  font-weight: 800;

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    background-color: #bed9f0bd;
    color: #0d5798;
  }
}

.markdown-body {
  padding-top: 8px;
  color: #333;
  overflow-wrap: anywhere;

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    color: #0d5798;
    font-weight: 800;
    line-height: 1.35;
  }

  :deep(h1) {
    margin: 22px 0 12px;
    font-size: 30px;
  }

  :deep(h2) {
    margin: 22px 0 10px;
    font-size: 26px;
  }

  :deep(h3) {
    margin: 18px 0 8px;
    font-size: 23px;
  }

  :deep(p),
  :deep(li) {
    font-size: 22px;
    line-height: 1.75;
  }

  :deep(p) {
    margin: 12px 0;
  }

  :deep(ul) {
    margin: 10px 0 14px;
    padding-left: 26px;
  }

  :deep(li) {
    margin: 8px 0;
  }

  :deep(strong) {
    color: #0d5798;
    font-weight: 800;
  }
}

.loading-text {
  margin: 0;
  padding: 32px 0;
  color: #2c77ad;
  font-size: 22px;
  line-height: 1.6;
  text-align: center;
}

.empty-state {
  margin-top: 20px;
  text-align: center;

  h1 {
    margin: 0;
    color: #0d5798;
    font-size: 32px;
    line-height: 1.3;
  }

  p {
    margin: 12px 0 20px;
    color: #333;
    font-size: 22px;
    line-height: 1.6;
  }
}

@media (max-width: 360px) {
  .article-header h1 {
    font-size: 30px;
  }

  .markdown-body {
    :deep(p),
    :deep(li) {
      font-size: 20px;
    }
  }
}
</style>
