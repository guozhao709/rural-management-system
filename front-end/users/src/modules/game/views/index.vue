<template>
  <FunctionHeader title="休闲游戏" />
  <main class="game-page">
    <section class="hero-section">
      <h1 class="hero-title">休闲游戏</h1>
      <p class="hero-subtitle">选择一款益智小游戏，轻松锻炼大脑</p>
    </section>

    <section class="game-grid">
      <div v-for="game in games" :key="game.id" class="game-card" @click="handleGameClick(game.id)">
        <span class="game-icon">{{ game.icon }}</span>
        <div class="game-info">
          <h2 class="game-name">{{ game.name }}</h2>
          <p class="game-desc">{{ game.desc }}</p>
        </div>
      </div>
    </section>

    <p class="coming-soon-note">更多游戏即将上线，敬请期待</p>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import FunctionHeader from "@/components/layout/FunctionHeader.vue";

const games = ref([
  { id: 1, name: "记忆翻牌", icon: "🃏", desc: "匹配卡片找出相同对子，锻炼记忆力与专注力。" },
  { id: 2, name: "趣味拼图", icon: "🧩", desc: "拖动图块拼出完整画面，锻炼空间想象力。" },
  { id: 3, name: "数字数独", icon: "🔢", desc: "填入数字完成九宫格谜题，训练逻辑思维。" },
  { id: 4, name: "找找不同", icon: "🔍", desc: "对比两张图片找出细微差别，锻炼观察力。" },
  { id: 5, name: "成语填字", icon: "📝", desc: "根据提示填入成语缺字，锻炼语言能力。" },
  { id: 6, name: "算数练习", icon: "🧮", desc: "练习简单的加减乘除运算，保持大脑活跃。" },
]);

const handleGameClick = (id: number) => {
  console.log("Game clicked:", id);
};
</script>

<style scoped lang="scss">
.game-page {
  min-height: calc(100dvh - 46px);
  box-sizing: border-box;
  padding: 12px 10px calc(92px + env(safe-area-inset-bottom));
  background-color: #f0f8ff;
  overflow-y: auto;
}

.hero-section {
  text-align: center;
  padding: 14px 16px 8px;

  .hero-title {
    margin: 0;
    font-size: 30px;
    font-weight: 800;
    color: #0d5798;
    line-height: 1.3;
  }

  .hero-subtitle {
    margin: 8px 0 0;
    font-size: 18px;
    color: #2c77ad;
    line-height: 1.5;
  }
}

.game-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0 0;
}

.game-card {
  display: flex;
  align-items: center;
  gap: 14px;
  box-sizing: border-box;
  padding: 18px 16px;
  border-radius: 16px;
  background-color: #fff;
  box-shadow: 0 6px 14px rgba(20, 135, 236, 0.08);
  transition: transform 0.16s ease, box-shadow 0.16s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 3px 8px rgba(20, 135, 236, 0.12);
  }
}

.game-icon {
  flex-shrink: 0;
  font-size: 40px;
  line-height: 1;
  width: 56px;
  text-align: center;
}

.game-info {
  min-width: 0;
  flex: 1;
}

.game-name {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #0d5798;
  line-height: 1.35;
}

.game-desc {
  margin: 6px 0 0;
  font-size: 18px;
  color: #333;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.coming-soon-note {
  margin: 20px 0 0;
  text-align: center;
  font-size: 16px;
  color: #2c77ad;
}
</style>
