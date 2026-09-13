<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { HealthProfile } from '../types/health'
const props = defineProps<{ profile: HealthProfile | null; loading: boolean; saving: boolean; enabled: boolean }>()
const emit = defineEmits<{ save: [input: Pick<HealthProfile, 'medicalHistory' | 'allergies' | 'specialPopulation'>] }>()
const form = reactive({ medicalHistory: '', allergies: '', specialPopulation: '' })
watch(() => props.profile, value => { form.medicalHistory = value?.medicalHistory ?? ''; form.allergies = value?.allergies ?? ''; form.specialPopulation = value?.specialPopulation ?? '' }, { immediate: true })
function save(): void { emit('save', { medicalHistory: form.medicalHistory.trim() || null, allergies: form.allergies.trim() || null, specialPopulation: form.specialPopulation.trim() || null }) }
</script>
<template><section class="panel"><h2>健康档案</h2><p v-if="!enabled" class="hint">请先授权“健康档案”后再填写。</p><van-loading v-else-if="loading">正在加载…</van-loading><template v-else><van-cell-group inset><van-field v-model="form.medicalHistory" label="既往健康情况" type="textarea" maxlength="2000" rows="3" /><van-field v-model="form.allergies" label="过敏信息" type="textarea" maxlength="1000" rows="2" /><van-field v-model="form.specialPopulation" label="特殊人群说明" type="textarea" maxlength="1000" rows="2" /></van-cell-group><van-button block round type="primary" :loading="saving" @click="save">保存健康档案</van-button></template></section></template>
<style scoped>.panel { display: grid; gap: 12px; padding: 16px; }.panel h2 { margin: 0; font-size: 20px; }.hint { margin: 0; color: var(--color-text-secondary); line-height: 1.6; }</style>
