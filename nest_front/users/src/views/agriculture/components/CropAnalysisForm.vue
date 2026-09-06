<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { AgricultureCrop, AnalysisInput } from '../types/agriculture'

interface Props { crops: AgricultureCrop[]; submitting: boolean }
const props = defineProps<Props>()
const emit = defineEmits<{ submit: [input: AnalysisInput] }>()
const form = reactive({ cropId: 0, regionCode: '', regionName: '', growthStage: '', observations: '', soilType: '', irrigationAvailable: false })
const cropOptions = computed(() => props.crops)
function submit(): void {
  if (!form.cropId || !form.regionCode.trim() || !form.regionName.trim()) return
  emit('submit', { cropId: form.cropId, regionCode: form.regionCode.trim(), regionName: form.regionName.trim(), growthStage: form.growthStage.trim() || undefined, observations: form.observations.split('\n').map(item => item.trim()).filter(Boolean), fieldContext: { soilType: form.soilType.trim() || undefined, irrigationAvailable: form.irrigationAvailable } })
}
</script>

<template>
  <section class="analysis-form" aria-labelledby="analysis-heading">
    <h2 id="analysis-heading" class="section-title">田间智能分析</h2>
    <p class="section-intro">填写作物和田间情况，获取可追溯的管理建议。</p>
    <van-cell-group inset>
      <van-field v-model.number="form.cropId" label="作物" required>
        <template #input><select v-model.number="form.cropId" class="select-input" aria-label="选择作物"><option :value="0" disabled>请选择作物</option><option v-for="crop in cropOptions" :key="crop.id" :value="crop.id">{{ crop.name }}</option></select></template>
      </van-field>
      <van-field v-model="form.regionName" label="地区名称" placeholder="如：陕西省西安市长安区" required maxlength="255" />
      <van-field v-model="form.regionCode" label="地区编码" placeholder="请输入行政区或业务地区编码" required maxlength="32" />
      <van-field v-model="form.growthStage" label="生育期" placeholder="如：拔节期（可选）" maxlength="64" />
      <van-field v-model="form.observations" label="田间观察" type="textarea" rows="3" autosize placeholder="每行一条，例如：叶尖轻微发黄" />
      <van-field v-model="form.soilType" label="土壤类型" placeholder="如：黄土（可选）" maxlength="100" />
      <van-cell title="具备灌溉条件"><template #value><van-switch v-model="form.irrigationAvailable" size="22" /></template></van-cell>
    </van-cell-group>
    <div class="submit-wrap"><van-button block round type="primary" :loading="submitting" @click="submit">开始分析</van-button></div>
  </section>
</template>

<style scoped>
.analysis-form { padding: 20px 0; }.section-title { margin: 0; font-size: 22px; }.section-intro { margin: 8px 0 16px; color: var(--color-text-secondary); font-size: 15px; line-height: 1.6; }.select-input { width: 100%; border: 0; color: var(--color-text-primary); background: transparent; font: inherit; }.submit-wrap { padding: 20px 16px 0; }
</style>
