<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { HealthConsent, HealthConsentScope } from '../types/health'

defineProps<{ consent: HealthConsent | null; saving: boolean }>()
const emit = defineEmits<{ grant: [scopes: HealthConsentScope[]]; revoke: [] }>()
const selections = reactive<Record<HealthConsentScope, boolean>>({ profile: true, measurement: true, assessment: true, ai_processing: false })
const enabledScopes = computed(() => (Object.keys(selections) as HealthConsentScope[]).filter(scope => selections[scope]))
function grant(): void { if (enabledScopes.value.length) emit('grant', enabledScopes.value) }
</script>

<template>
  <section class="panel" aria-labelledby="consent-title">
    <h2 id="consent-title">健康数据授权</h2>
    <p class="intro">健康档案、测量和评估属于敏感个人信息。您可选择授权范围，并随时撤回。</p>
    <template v-if="consent">
      <p class="status">已授权：{{ consent.scopes.join('、') }}</p>
      <van-button block round plain type="primary" :loading="saving" @click="emit('revoke')">撤回健康数据授权</van-button>
    </template>
    <template v-else>
      <van-cell-group inset><van-cell title="健康档案" clickable @click="selections.profile = !selections.profile"><template #right-icon><van-checkbox v-model="selections.profile" @click.stop /></template></van-cell><van-cell title="健康测量" clickable @click="selections.measurement = !selections.measurement"><template #right-icon><van-checkbox v-model="selections.measurement" @click.stop /></template></van-cell><van-cell title="健康评估" clickable @click="selections.assessment = !selections.assessment"><template #right-icon><van-checkbox v-model="selections.assessment" @click.stop /></template></van-cell><van-cell title="允许 AI 生成说明（可选）" clickable @click="selections.ai_processing = !selections.ai_processing"><template #right-icon><van-checkbox v-model="selections.ai_processing" @click.stop /></template></van-cell></van-cell-group>
      <van-button block round type="primary" :disabled="!enabledScopes.length" :loading="saving" @click="grant">确认授权</van-button>
    </template>
  </section>
</template>

<style scoped>
.panel { display: grid; gap: 12px; padding: 16px; }.panel h2 { margin: 0; font-size: 20px; }.intro, .status { margin: 0; color: var(--color-text-secondary); font-size: 14px; line-height: 1.6; }.status { color: var(--color-success); }
</style>
