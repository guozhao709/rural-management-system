<template>
  <FunctionHeader title="医院助手" />
  <main class="hospital-page">
    <section class="hero-section">
      <h1 class="hero-title">医院助手</h1>
      <p class="hero-subtitle">选择合适的医院，看病更轻松</p>
    </section>

    <section class="hospital-grid">
      <div v-for="hospital in hospitals" :key="hospital.id" class="hospital-card">
        <span class="hospital-icon">{{ hospital.icon }}</span>
        <div class="hospital-info">
          <h2 class="hospital-name">{{ hospital.name }}</h2>
          <p class="hospital-desc">{{ hospital.desc }}</p>
          <div class="specialty-tags">
            <span v-for="tag in hospital.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>
      </div>
    </section>

    <p class="coming-soon-note">更多医院即将上线，敬请期待</p>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import FunctionHeader from "@/components/layout/FunctionHeader.vue";

const hospitals = ref([
  {
    id: 1,
    name: "社区卫生服务中心",
    icon: "🏥",
    desc: "就近看病，方便快捷，医保报销比例高。",
    tags: ["感冒发热", "高血压", "糖尿病", "健康管理"],
  },
  {
    id: 2,
    name: "老年病专科医院",
    icon: "🧓",
    desc: "专门针对老年疾病，医生经验丰富。",
    tags: ["心脑血管病", "骨质疏松", "帕金森", "老年痴呆"],
  },
  {
    id: 3,
    name: "综合医院内科",
    icon: "🔬",
    desc: "设备齐全，科室全面，可做系统检查。",
    tags: ["心脏病", "肺部疾病", "肠胃病", "肝肾疾病"],
  },
  {
    id: 4,
    name: "中医医院",
    icon: "🌿",
    desc: "针灸推拿、中药调理，温和治本。",
    tags: ["慢性病康复", "腰腿疼痛", "失眠", "养生调理"],
  },
  {
    id: 5,
    name: "康复医院",
    icon: "🦾",
    desc: "专业康复训练，帮助恢复身体功能。",
    tags: ["中风康复", "骨折术后", "关节置换", "康复训练"],
  },
  {
    id: 6,
    name: "眼科医院",
    icon: "👁️",
    desc: "专门检查治疗眼部疾病，保护视力。",
    tags: ["白内障", "青光眼", "老花眼", "眼底病变"],
  },
]);
</script>

<style scoped lang="scss">
.hospital-page {
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

.hospital-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0 0;
}

.hospital-card {
  display: flex;
  align-items: flex-start;
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

.hospital-icon {
  flex-shrink: 0;
  font-size: 40px;
  line-height: 1;
  width: 56px;
  text-align: center;
  padding-top: 2px;
}

.hospital-info {
  min-width: 0;
  flex: 1;
}

.hospital-name {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #0d5798;
  line-height: 1.35;
}

.hospital-desc {
  margin: 6px 0 0;
  font-size: 18px;
  color: #333;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.specialty-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.tag {
  display: inline-block;
  padding: 4px 12px;
  font-size: 15px;
  line-height: 1.5;
  color: #fff;
  background-color: #74caff;
  border-radius: 8px;
  white-space: nowrap;
}

.coming-soon-note {
  margin: 20px 0 0;
  text-align: center;
  font-size: 16px;
  color: #2c77ad;
}
</style>
