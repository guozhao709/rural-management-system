<template>
  <main class="services-page">
    <header class="page-intro">
      <h1>选择需要的服务</h1>
      <p>点击下方卡片进入对应功能</p>
    </header>

    <section class="cards" aria-label="便民服务列表">
      <button
        v-for="item in serviceCards"
        :key="item.id"
        class="card"
        :class="`tone-${item.tone}`"
        type="button"
        @click="handleServiceClick(item.id)"
      >
        <span class="card-icon">{{ item.icon }}</span>
        <div class="word">
          <h2>{{ item.name }}</h2>
          <p>{{ item.meta }}</p>
        </div>
        <span class="card-arrow" aria-hidden="true">›</span>
      </button>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
// 添加服务页跳转路由
const handleServiceClick = (id: number) => {
  switch (id) {
    case 1:
      router.push("/services/healthy");
      break;
    case 2:
      router.push("/services/agriculture");
      break;
    case 3:
      router.push("/services/hospital");
      break;
    case 4:
      router.push("/services/game");
      break;
    case 5:
      router.push("/services/villageCommittee");
      break;
    default:
      break;
  }
};

const serviceCards = ref([
  {
    id: 1,
    name: "健康助手",
    meta: "根据您的情况，为您提供专业的健康建议。",
    icon: "康",
    tone: "health",
  },
  {
    id: 2,
    name: "农业助手",
    meta: "想尝试新的作物？",
    icon: "农",
    tone: "farm",
  },
  {
    id: 3,
    name: "医院助手",
    meta: "看病难， 请咨询医院助手。",
    icon: "医",
    tone: "hospital",
  },
  {
    id: 4,
    name: "休闲游戏",
    meta: "记忆翻牌、趣味拼图、数独等益智小游戏，轻松锻炼大脑。",
    icon: "乐",
    tone: "game",
  },
  {
    id: 5,
    name: "村委会",
    meta: "点对点联系村委会。",
    icon: "村",
    tone: "village",
  },
]);
</script>

<style scoped lang="scss">
.services-page {
  min-height: calc(100dvh - 46px);
  box-sizing: border-box;
  padding: 12px 10px calc(92px + env(safe-area-inset-bottom));
  background-color: #f0f8ff;
  color: #1f2933;
  overflow-y: auto;
}

.page-intro {
  padding: 8px 6px 12px;

  h1 {
    margin: 0;
    color: #0d5798;
    font-size: 30px;
    line-height: 1.3;
    font-weight: 800;
  }

  p {
    margin: 6px 0 0;
    color: #2c77ad;
    font-size: 18px;
    line-height: 1.5;
  }
}

.cards {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .card {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 118px;
    box-sizing: border-box;
    border: 1px solid rgba(20, 135, 236, 0.08);
    border-radius: 16px;
    padding: 16px 14px;
    background-color: #fff;
    font: inherit;
    text-align: left;
    box-shadow: 0 6px 14px rgba(20, 135, 236, 0.08);
    transition:
      transform 0.16s ease,
      box-shadow 0.16s ease;

    &:active {
      transform: scale(0.98);
      box-shadow: 0 3px 8px rgba(20, 135, 236, 0.12);
    }

    &.tone-health {
      --tone-color: #20a77a;
      --tone-bg: #e7f8f0;
    }

    &.tone-farm {
      --tone-color: #3f8f35;
      --tone-bg: #edf8e8;
    }

    &.tone-hospital {
      --tone-color: #2f7fd1;
      --tone-bg: #eaf3ff;
    }

    &.tone-game {
      --tone-color: #d18a1f;
      --tone-bg: #fff6df;
    }

    &.tone-village {
      --tone-color: #8b65d9;
      --tone-bg: #f2edff;
    }

    .word {
      min-width: 0;
      flex: 1;

      h2 {
        margin: 0;
        color: #0d5798;
        font-size: 28px;
        line-height: 1.35;
        font-weight: 800;
        overflow-wrap: anywhere;
      }

      p {
        margin: 6px 0 0;
        color: #333;
        font-size: 18px;
        line-height: 1.55;
        overflow-wrap: anywhere;
      }
    }
  }
}

.card-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background-color: var(--tone-bg);
  color: var(--tone-color);
  font-size: 26px;
  line-height: 1;
  font-weight: 800;
}

.card-arrow {
  flex: 0 0 auto;
  color: var(--tone-color);
  font-size: 36px;
  line-height: 1;
  font-weight: 700;
}

@media (max-width: 360px) {
  .page-intro h1 {
    font-size: 28px;
  }

  .cards .card {
    gap: 10px;
    padding: 14px 12px;

    .word h2 {
      font-size: 26px;
    }

    .word p {
      font-size: 17px;
    }
  }

  .card-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    font-size: 24px;
  }
}
</style>
