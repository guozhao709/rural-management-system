<template>
  <div class="container">
    <FunctionHeader :title="navBarTitle[active as keyof typeof navBarTitle]" />
    <article>
      <router-view></router-view>
    </article>
    <!-- 单行向更新值 -->
    <van-tabbar :model-value="active">
      <van-tabbar-item name="home" icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item name="services" icon="orders-o" to="/services">便民服务</van-tabbar-item>
      <van-tabbar-item name="ai" icon="chat-o" to="/ai">AI</van-tabbar-item>
      <van-tabbar-item name="user" icon="user-o" to="/user">个人</van-tabbar-item>
    </van-tabbar>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import FunctionHeader from '@/components/layout/FunctionHeader.vue';

const route = useRoute();

const navBarTitle = {
  home: '首页',
  services: '便民服务',
  ai: 'AI',
  user: '个人',
}

// 导航栏当前激活的tab
const active = computed(() => {
  const path = route.path;
  if (path.startsWith('/home')) return 'home';
  if (path.startsWith('/services') || path.startsWith('/function')) return 'services';
  if (path.startsWith('/ai')) return 'ai';
  if (path.startsWith('/user')) return 'user';

  return 'home';
});;
</script>

<style scoped lang="scss"></style>
