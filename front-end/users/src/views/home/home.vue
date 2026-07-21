<template>
  <main class="home-page">
    <section class="notice-section" aria-label="重要通知">
      <van-swipe class="notice-swipe" :autoplay="10000" height="168" indicator-color="white">
        <van-swipe-item v-for="item in notices" :key="item.id">
          <article class="notice-item" @click="handleArticleClick(item.id)">
            <p class="notice-content">{{ item.content }}</p>
            <time class="notice-date">{{ item.date }}</time>
          </article>
        </van-swipe-item>
      </van-swipe>
    </section>

    <section class="column-section" aria-label="服务专栏">
      <div class="section-header">
        <h2>服务专栏</h2>
        <span>点击查看文章</span>
      </div>

      <div class="article-list">
        <button
          v-for="item in articles"
          :key="item.id"
          class="article-card"
          type="button"
          @click="handleArticleClick(item.id)"
        >
          <span class="article-title">{{ item.title }}</span>
          <span class="article-summary">{{ item.summary }}</span>
          <time class="article-date">{{ item.date }}</time>
        </button>
      </div>
    </section>

    <section class="phone-section" aria-label="紧急电话">
      <div class="section-header">
        <h2>紧急电话</h2>
        <span>点击号码可拨打</span>
      </div>

      <div class="phone-list">
        <a
          v-for="item in emergencyPhones"
          :key="item.id"
          class="phone-card"
          :href="`tel:${item.phone}`"
        >
          <span class="phone-title">{{ item.title }}</span>
          <strong class="phone-number">{{ item.phone }}</strong>
        </a>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { checkToken } from "@/api/modules/auth";
import { getBannerArticles, getArticles } from "@/api/modules/article";

const router = useRouter();

interface NoticeItem {
  id: number;
  content: string;
  date: string;
}

interface ArticleItem {
  id: number;
  title: string;
  summary: string;
  date: string;
}

const notices = ref<NoticeItem[]>([]);
const articles = ref<ArticleItem[]>([]);
const loading = ref(true);

onMounted(async () => {
  const res = await checkToken();
  if (res.code !== 200) {
    router.push("/login");
    return;
  }

  try {
    const [bannerRes, articleRes] = await Promise.all([
      getBannerArticles(),
      getArticles({ page: 1, pageSize: 10 }),
    ]);

    notices.value = (bannerRes.data || []).map((item: any) => ({
      id: item.id,
      content: item.title,
      date: item.createTime,
    }));

    articles.value = ((articleRes.data as any)?.list || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      summary: item.summary || "",
      date: item.createTime,
    }));
  } catch (error) {
    console.error("获取首页数据失败:", error);
  } finally {
    loading.value = false;
  }
});

const emergencyPhones = [
  {
    id: 1,
    title: "村委电话",
    phone: "1288888888",
  },
  {
    id: 2,
    title: "医疗电话",
    phone: "1288888888",
  },
  {
    id: 3,
    title: "报警电话",
    phone: "110",
  },
  {
    id: 4,
    title: "便民服务",
    phone: "1288888888",
  },
];

const handleArticleClick = (id: number) => {
  router.push(`/article/${id}`);
};
</script>

<style scoped lang="scss">
.home-page {
  min-height: calc(100dvh - 96px);
  box-sizing: border-box;
  padding: 10px 10px 92px;
  background-color: #f0f8ff;
}

.notice-section,
.column-section,
.phone-section {
  margin-top: 12px;
}

.column-section {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  height: 430px;
  box-sizing: border-box;
  padding: 10px 0 12px;
  background-color: #f0f8ff;
}

.notice-swipe {
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 8px 18px rgba(20, 135, 236, 0.12);

  :deep(.van-swipe__indicator) {
    width: 8px;
    height: 8px;
    opacity: 0.7;
  }
}

.notice-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  box-sizing: border-box;
  padding: 18px 18px 16px;
  color: #fff;
  background-color: #74caff;
}

.notice-content {
  margin: 0;
  color: #fff;
  font-size: 26px;
  line-height: 1.45;
  font-weight: 700;
  text-align: left;
  overflow-wrap: anywhere;
}

.notice-date {
  display: block;
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.92);
  font-size: 18px;
  line-height: 1.4;
  text-align: right;
}

.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;

  h2 {
    margin: 0;
    color: #0d5798;
    font-size: 28px;
    line-height: 1.3;
    font-weight: 800;
  }

  span {
    flex: 0 0 auto;
    color: #2c77ad;
    font-size: 17px;
    line-height: 1.4;
  }
}

.article-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  min-height: 0;
  padding: 0 4px 12px 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.article-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  min-width: 0;
  min-height: 154px;
  box-sizing: border-box;
  border: 0;
  border-radius: 16px;
  padding: 18px 16px;
  background-color: #fff;
  font: inherit;
  text-align: left;
  box-shadow: 0 6px 14px rgba(20, 135, 236, 0.08);
  transition: transform 0.16s ease, box-shadow 0.16s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 3px 8px rgba(20, 135, 236, 0.12);
  }
}

.article-title {
  color: #0d5798;
  font-size: 24px;
  line-height: 1.35;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.article-summary {
  display: block;
  margin: 0;
  color: #333;
  font-size: 18px;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.article-date {
  margin-top: auto;
  padding-top: 2px;
  color: #2c77ad;
  font-size: 17px;
  line-height: 1.4;
}

.phone-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.phone-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 96px;
  box-sizing: border-box;
  border-radius: 14px;
  padding: 14px 10px;
  color: #fff;
  text-align: center;
  text-decoration: none;
  background-color: #f02828af;
  box-shadow: 0 6px 14px rgba(240, 40, 40, 0.12);

  &:active {
    transform: scale(0.98);
  }
}

.phone-title {
  color: #fff;
  font-size: 21px;
  line-height: 1.35;
  font-weight: 700;
}

.phone-number {
  margin-top: 8px;
  color: #fff;
  font-size: 28px;
  line-height: 1.25;
  font-weight: 800;
  overflow-wrap: anywhere;
}

@media (max-width: 360px) {
  .column-section {
    height: 390px;
  }

  .notice-content {
    font-size: 23px;
  }

  .section-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;

    h2 {
      font-size: 26px;
    }
  }

  .article-title {
    font-size: 22px;
  }

  .article-summary {
    font-size: 18px;
  }

  .phone-list {
    grid-template-columns: 1fr;
  }
}
</style>
