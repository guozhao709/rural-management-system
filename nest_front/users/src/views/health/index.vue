<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { healthApi } from './api/health'
import AssessmentPanel from './components/AssessmentPanel.vue'
import HealthConsentPanel from './components/HealthConsentPanel.vue'
import HealthKnowledgePanel from './components/HealthKnowledgePanel.vue'
import HealthProfilePanel from './components/HealthProfilePanel.vue'
import MeasurementPanel from './components/MeasurementPanel.vue'
import type { CreateAssessmentInput, CreateMeasurementInput, HealthAssessment, HealthConsent, HealthConsentScope, HealthKnowledge, HealthMeasurement, HealthProfile } from './types/health'
import { getHealthUserFacingError } from './utils/health-error'

defineOptions({ name: 'ResidentHealthView' })
const router = useRouter()
const consent = shallowRef<HealthConsent | null>(null); const profile = shallowRef<HealthProfile | null>(null); const measurements = shallowRef<HealthMeasurement[]>([]); const assessments = shallowRef<HealthAssessment[]>([]); const knowledge = shallowRef<HealthKnowledge[]>([])
const loading = shallowRef(true); const consentSaving = shallowRef(false); const profileSaving = shallowRef(false); const measurementSaving = shallowRef(false); const assessmentSaving = shallowRef(false); const knowledgeLoading = shallowRef(false); const errorMessage = shallowRef('')
const canUseProfile = computed(() => consent.value?.scopes.includes('profile') ?? false); const canUseMeasurements = computed(() => consent.value?.scopes.includes('measurement') ?? false); const canUseAssessment = computed(() => consent.value?.scopes.includes('assessment') ?? false)
function fail(error: unknown, unavailableMessage = '健康服务暂时不可用，请稍后再试。'): void { errorMessage.value = getHealthUserFacingError(error, unavailableMessage) }
async function loadProtected(): Promise<void> { if (!consent.value) { profile.value = null; measurements.value = []; assessments.value = []; return } const [nextProfile, nextMeasurements, nextAssessments] = await Promise.all([canUseProfile.value ? healthApi.getProfile() : Promise.resolve(null), canUseMeasurements.value ? healthApi.measurements() : Promise.resolve({ list: [] }), canUseAssessment.value ? healthApi.assessments() : Promise.resolve({ list: [] })]); profile.value = nextProfile; measurements.value = nextMeasurements.list; assessments.value = nextAssessments.list }
async function load(): Promise<void> { loading.value = true; errorMessage.value = ''; try { consent.value = await healthApi.currentConsent(); await Promise.all([loadProtected(), searchKnowledge('')]) } catch (error) { fail(error) } finally { loading.value = false } }
async function grant(scopes: HealthConsentScope[]): Promise<void> { consentSaving.value = true; errorMessage.value = ''; try { consent.value = await healthApi.grantConsent(scopes); await loadProtected() } catch (error) { fail(error) } finally { consentSaving.value = false } }
async function revoke(): Promise<void> { consentSaving.value = true; errorMessage.value = ''; try { await healthApi.revokeConsent(); consent.value = null; profile.value = null; measurements.value = []; assessments.value = [] } catch (error) { fail(error) } finally { consentSaving.value = false } }
async function saveProfile(input: Pick<HealthProfile, 'medicalHistory' | 'allergies' | 'specialPopulation'>): Promise<void> { profileSaving.value = true; try { profile.value = await healthApi.updateProfile(input) } catch (error) { fail(error) } finally { profileSaving.value = false } }
async function createMeasurement(input: CreateMeasurementInput): Promise<void> { measurementSaving.value = true; try { measurements.value = [await healthApi.createMeasurement(input), ...measurements.value] } catch (error) { fail(error) } finally { measurementSaving.value = false } }
async function removeMeasurement(id: string): Promise<void> { try { await healthApi.deleteMeasurement(id); measurements.value = measurements.value.filter(item => item.id !== id) } catch (error) { fail(error) } }
async function createAssessment(input: CreateAssessmentInput): Promise<void> { assessmentSaving.value = true; errorMessage.value = ''; try { assessments.value = [await healthApi.createAssessment(input), ...assessments.value] } catch (error) { fail(error, '暂时无法评估，请稍后再试。') } finally { assessmentSaving.value = false } }
async function removeAssessment(id: string): Promise<void> { try { await healthApi.deleteAssessment(id); assessments.value = assessments.value.filter(item => item.id !== id) } catch (error) { fail(error) } }
async function searchKnowledge(keyword: string): Promise<void> { knowledgeLoading.value = true; try { knowledge.value = await healthApi.knowledge(keyword) } catch (error) { fail(error) } finally { knowledgeLoading.value = false } }
onMounted(() => { void load() })
</script>
<template><main class="health-page"><van-nav-bar title="健康服务" left-text="返回" left-arrow @click-left="router.push({ name: 'user-home' })" /><p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p><van-loading v-if="loading" class="page-loading">正在加载健康服务…</van-loading><van-tabs v-else sticky><van-tab title="我的健康"><HealthConsentPanel :consent="consent" :saving="consentSaving" @grant="grant" @revoke="revoke" /><HealthProfilePanel :profile="profile" :enabled="canUseProfile" :loading="false" :saving="profileSaving" @save="saveProfile" /><MeasurementPanel :items="measurements" :enabled="canUseMeasurements" :loading="false" :saving="measurementSaving" @create="createMeasurement" @remove="removeMeasurement" /></van-tab><van-tab title="健康评估"><AssessmentPanel :items="assessments" :measurements="measurements" :enabled="canUseAssessment" :loading="false" :saving="assessmentSaving" @create="createAssessment" @remove="removeAssessment" /></van-tab><van-tab title="健康知识"><HealthKnowledgePanel :items="knowledge" :loading="knowledgeLoading" @search="searchKnowledge" /></van-tab></van-tabs></main></template>
<style scoped>.health-page { min-height: 100svh; background: var(--color-bg-secondary); }.error { margin: 12px 16px 0; color: var(--color-danger); }.page-loading { display: block; padding: 48px; text-align: center; }</style>
