import { reactive, shallowRef } from 'vue'
import { getUserFacingError } from '../../../app/auth'
import { healthApi } from '../api/health'
import type { HealthProfile, HealthProfileInput } from '../types/health'

const emptyProfile: HealthProfileInput = {
  sex: null,
  birthDate: null,
  heightCm: null,
  smokingStatus: null,
  drinkingStatus: null,
  exerciseStatus: null,
  sleepStatus: null,
  healthHistory: null,
  allergies: null,
}

export function useHealthProfile() {
  const profile = shallowRef<HealthProfile | null>(null)
  const loading = shallowRef(false)
  const saving = shallowRef(false)
  const loaded = shallowRef(false)
  const errorMessage = shallowRef('')
  const form = reactive<HealthProfileInput>({ ...emptyProfile })

  function applyProfile(value: HealthProfile | null): void {
    profile.value = value
    Object.assign(form, value ? {
      sex: value.sex,
      birthDate: value.birthDate,
      heightCm: value.heightCm,
      smokingStatus: value.smokingStatus,
      drinkingStatus: value.drinkingStatus,
      exerciseStatus: value.exerciseStatus,
      sleepStatus: value.sleepStatus,
      healthHistory: value.healthHistory,
      allergies: value.allergies,
    } : emptyProfile)
  }

  async function load(): Promise<void> {
    loading.value = true
    errorMessage.value = ''
    try { applyProfile(await healthApi.getProfile()) } catch (error) { errorMessage.value = getUserFacingError(error) } finally { loading.value = false; loaded.value = true }
  }

  async function save(input?: HealthProfileInput): Promise<boolean> {
    saving.value = true
    errorMessage.value = ''
    try { applyProfile(await healthApi.saveProfile(input ?? { ...form })); return true } catch (error) { errorMessage.value = getUserFacingError(error); return false } finally { saving.value = false }
  }

  return { profile, form, loading, saving, loaded, errorMessage, load, save }
}
