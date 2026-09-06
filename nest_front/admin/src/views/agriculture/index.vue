<script setup lang="ts">
import { useRouter } from 'vue-router'
import CropCatalog from './components/CropCatalog.vue'
import KnowledgeManager from './components/KnowledgeManager.vue'
const router = useRouter()
defineOptions({ name: 'AgricultureManagementView' })
</script>
<template><main class="agriculture-page"><header class="page-header"><div><p class="eyebrow">智乡云 · 农业模块</p><h1>农业内容管理</h1></div><el-button @click="router.push({ name: 'admin-dashboard' })">返回工作台</el-button></header><el-tabs class="agriculture-tabs"><el-tab-pane label="作物目录"><CropCatalog /></el-tab-pane><el-tab-pane label="农业知识"><KnowledgeManager /></el-tab-pane></el-tabs></main></template>
<style scoped>.agriculture-page { min-height: 100svh; background: var(--color-bg-secondary); }.page-header { display: flex; justify-content: space-between; align-items: center; padding: 28px 32px 20px; background: #fff; border-bottom: 1px solid var(--color-border); }.eyebrow { margin: 0; color: var(--color-primary); font-size: 14px; font-weight: 600; }.page-header h1 { margin: 6px 0 0; font-size: 28px; }.agriculture-tabs { margin: 24px 32px; padding: 0 24px; border-radius: 10px; background: #fff; }</style>
