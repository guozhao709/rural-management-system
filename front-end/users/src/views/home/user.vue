<template>
  <div class="user-page">
    <div class="userInfo">
      <div class="userAvatar">
        <van-image src="../../../public/image/userAvatar.png" width="132" height="132" round />
      </div>
      <div class="userName">
        <p class="name">{{ userInfo.name || "未设置姓名" }}</p>
        <p class="phone">{{ userInfo.phone || "未绑定手机号" }}</p>
      </div>
    </div>

    <div class="user-setting">
      <button
        v-for="value in functionArray"
        :key="value.id"
        class="setting"
        type="button"
        @click="openFunctionPopup(value)"
      >
        <span class="setting-title">{{ value.title }}</span>
        <span class="setting-desc">{{ value.description }}</span>
      </button>
    </div>

    <van-popup
      v-model:show="showPopup"
      round
      position="bottom"
      closeable
      class="function-popup"
    >
      <section v-if="activeFunction" class="popup-card">
        <header class="popup-header">
          <h2>{{ activeFunction.title }}</h2>
          <p>{{ activeFunction.description }}</p>
        </header>

        <van-form v-if="activeFunction.id === 1" class="user-form" @submit="handleUpdateUserInfo">
          <van-cell-group inset>
            <van-field
              v-model="userForm.name"
              name="name"
              label="姓名"
              placeholder="请输入姓名"
            />
            <van-field
              v-model="userForm.phone"
              name="phone"
              label="手机号"
              placeholder="请输入手机号"
              :rules="[{ required: true, message: '请填写手机号' }]"
            />
            <van-field name="gender" label="性别">
              <template #input>
                <van-radio-group v-model="userForm.gender" direction="horizontal">
                  <van-radio :name="0">男</van-radio>
                  <van-radio :name="1">女</van-radio>
                </van-radio-group>
              </template>
            </van-field>
            <van-field
              v-model="userForm.birthday"
              is-link
              readonly
              name="birthday"
              label="生日"
              placeholder="请选择生日"
              @click="showBirthdayPicker = true"
            />
            <van-field
              v-model="userForm.address"
              name="address"
              label="地址"
              type="textarea"
              rows="2"
              autosize
              placeholder="请输入地址"
            />
            <van-field
              v-model="userForm.password"
              name="password"
              label="密码"
              type="password"
              placeholder="请输入密码"
              :rules="[{ required: true, message: '请填写密码' }]"
            />
          </van-cell-group>

          <div class="popup-actions">
            <van-button block round type="primary" native-type="submit" class="popup-action-btn" :loading="isUpdating">
              保存修改
            </van-button>
            <van-button block round plain type="primary" class="popup-close-btn" @click="showPopup = false">
              关闭
            </van-button>
          </div>
        </van-form>

        <div v-else-if="activeFunction.id === 2" class="health-panel">
          <div v-if="isHealthLoading" class="health-loading">
            正在查询最新健康分析...
          </div>

          <div v-else-if="healthErrorMessage || !healthResult" class="health-empty">
            <p>{{ healthErrorMessage || "暂无健康分析记录" }}</p>
            <div class="popup-actions">
              <van-button block round type="primary" class="popup-action-btn" :loading="isHealthLoading" @click="loadHealthAnalysis">
                重新查询
              </van-button>
              <van-button block round plain type="primary" class="popup-close-btn" @click="showPopup = false">
                关闭
              </van-button>
            </div>
          </div>

          <div v-else class="health-result">
            <section class="health-card health-risk-card">
              <div class="health-meta">最近分析时间：{{ healthAnalysisTime || "暂无分析时间" }}</div>
              <div class="health-risk-row">
                <span class="health-card-title">风险等级</span>
                <van-tag round size="large" :type="riskTagTypeMap[healthResult.riskLevel]">
                  {{ riskTextMap[healthResult.riskLevel] }}
                </van-tag>
              </div>
              <p>{{ healthResult.riskDescription || "暂无风险描述" }}</p>
            </section>

            <section class="health-card health-summary">
              <div class="health-risk-row">
                <span class="health-card-title">健康总结</span>
                <van-tag round size="large" :type="riskTagTypeMap[healthResult.riskLevel]">
                  {{ summaryTextMap[healthResult.summary.status] }}
                </van-tag>
              </div>
              <p>{{ healthResult.summary.message }}</p>
            </section>

            <section class="health-card health-section">
              <h3>疾病预测</h3>
              <div class="prediction-list">
                <div v-for="item in healthResult.predictions" :key="item.name" class="prediction-item">
                  <span>{{ item.name }}</span>
                  <van-tag round :type="getProbabilityTagType(item.probability)">
                    {{ item.probability }}
                  </van-tag>
                </div>
              </div>
            </section>

            <section class="health-card health-section">
              <h3>病情解释</h3>
              <ul class="health-list">
                <li v-for="item in healthResult.explanation" :key="item">{{ item }}</li>
              </ul>
            </section>

            <section class="health-card health-section">
              <h3>建议用药</h3>
              <div v-if="healthResult.medicines.length" class="medicine-tags">
                <van-tag
                  v-for="item in healthResult.medicines"
                  :key="`${item.name}-${item.type}`"
                  round
                  size="large"
                  :type="item.type === 'prescription' ? 'warning' : 'primary'"
                >
                  {{ item.name }} · {{ item.type }}
                </van-tag>
              </div>
              <p v-else class="health-muted">暂无用药建议</p>
            </section>

            <section class="health-card health-section">
              <h3>就医建议</h3>
              <ul class="health-list">
                <li v-for="item in healthResult.suggestions" :key="item">{{ item }}</li>
              </ul>
            </section>

            <section class="health-card health-section">
              <h3>生活建议</h3>
              <ul class="health-list">
                <li v-for="item in healthResult.lifestyleSuggestions" :key="item">{{ item }}</li>
              </ul>
            </section>

            <section class="health-card health-section">
              <h3>警惕信号</h3>
              <ul v-if="healthResult.warningSignals.length" class="health-list warning-list">
                <li v-for="item in healthResult.warningSignals" :key="item">{{ item }}</li>
              </ul>
              <p v-else class="health-muted">暂无明显警惕信号</p>
            </section>

            <section class="health-status-grid">
              <div class="health-status-card">
                <span>是否需要就医</span>
                <strong>{{ healthResult.needHospital ? "建议就医" : "暂不强制就医" }}</strong>
              </div>
              <div class="health-status-card">
                <span>是否紧急</span>
                <strong>{{ healthResult.emergency ? "紧急处理" : "非紧急" }}</strong>
              </div>
            </section>

            <div class="popup-actions">
              <van-button block round type="primary" class="popup-action-btn" :loading="isHealthLoading" @click="loadHealthAnalysis">
                重新查询
              </van-button>
              <van-button block round plain type="primary" class="popup-close-btn" @click="showPopup = false">
                关闭
              </van-button>
            </div>
          </div>
        </div>

        <div v-else class="popup-content">
          {{ activeFunction.content }}
        </div>

        <div v-if="activeFunction.id !== 1 && activeFunction.id !== 2" class="popup-actions">
          <van-button block round type="primary" class="popup-action-btn">
            {{ activeFunction.actionText }}
          </van-button>
          <van-button block round plain type="primary" class="popup-close-btn" @click="showPopup = false">
            关闭
          </van-button>
        </div>
      </section>
    </van-popup>

    <van-popup v-model:show="showBirthdayPicker" position="bottom" round>
      <van-date-picker
        title="选择生日"
        :min-date="new Date('1900-01-01')"
        :max-date="new Date()"
        @confirm="handleBirthdayConfirm"
        @cancel="showBirthdayPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { showNotify } from "vant";
import { updateUserInfo } from "@/api/modules/auth";
import { getHealthyAnalysisFromDB } from "@/api/modules/healthy";
import { useHealthyAnalysis } from "@/modules/healthy/composables/useHealthyAnalysis";
import type { AnalysisResult } from "@/modules/healthy/types";

interface UserFunctionItem {
  id: number;
  title: string;
  description: string;
  content: string;
  actionText: string;
}

interface UserInfo {
  id?: number;
  phone?: string;
  password?: string;
  name?: string;
  gender?: number;
  birthday?: string;
  address?: string;
  create_time?: string;
  [key: string]: unknown;
}

interface UserInfoForm {
  name: string;
  phone: string;
  gender: number;
  birthday: string;
  address: string;
  password: string;
}

const getStoredUserInfo = (): UserInfo => {
  try {
    return JSON.parse(localStorage.getItem("userInfo") || "{}");
  } catch {
    return {};
  }
};

const userInfo = ref<UserInfo>(getStoredUserInfo());

const showPopup = ref(false);
const showBirthdayPicker = ref(false);
const isUpdating = ref(false);
const isHealthLoading = ref(false);
const activeFunction = ref<UserFunctionItem | null>(null);
const healthResult = ref<AnalysisResult | null>(null);
const healthAnalysisTime = ref("");
const healthErrorMessage = ref("");
const userForm = reactive<UserInfoForm>({
  name: "",
  phone: "",
  gender: 0,
  birthday: "",
  address: "",
  password: "",
});

const {
  normalizeAnalysis,
  riskTextMap,
  riskTagTypeMap,
  summaryTextMap,
  getProbabilityTagType,
} = useHealthyAnalysis();

const functionArray: UserFunctionItem[] = [
  {
    id: 1,
    title: "修改个人信息",
    description: "更新姓名、生日、住址等基础资料",
    content: "这里将用于展示和编辑个人基础信息。当前版本先保留静态入口，后续可接入修改个人信息接口。",
    actionText: "查看个人资料",
  },
  {
    id: 2,
    title: "查询个人健康",
    description: "查看健康分析记录和近期建议",
    content: "这里将用于展示个人健康分析历史、风险等级和生活建议。当前版本先保留静态入口。",
    actionText: "查看健康记录",
  },
  {
    id: 3,
    title: "联系客服",
    description: "获取服务支持和问题反馈入口",
    content: "如遇到登录、信息修改或功能使用问题，可通过客服入口联系工作人员协助处理。",
    actionText: "联系客服",
  },
  {
    id: 4,
    title: "退出登录",
    description: "结束当前账号会话",
    content: "当前页面仅展示退出登录入口，不会直接清空登录状态。如需真实退出，可后续接入登录态清理和路由跳转。",
    actionText: "了解退出说明",
  },
];

const normalizeGender = (gender: unknown) => {
  return Number(gender) === 1 ? 1 : 0;
};

const fillUserForm = () => {
  userForm.name = userInfo.value.name || "";
  userForm.phone = userInfo.value.phone || "";
  userForm.gender = normalizeGender(userInfo.value.gender);
  userForm.birthday = userInfo.value.birthday || "";
  userForm.address = userInfo.value.address || "";
  userForm.password = userInfo.value.password || "";
};

const parseHealthAnalysis = (analysis: unknown) => {
  if (typeof analysis !== "string") {
    return analysis;
  }

  try {
    return JSON.parse(analysis);
  } catch {
    throw new Error("健康分析数据解析失败");
  }
};

const resetHealthState = () => {
  healthResult.value = null;
  healthAnalysisTime.value = "";
  healthErrorMessage.value = "";
};

const loadHealthAnalysis = async () => {
  if (isHealthLoading.value) {
    return;
  }

  const phone = userInfo.value.phone?.trim();
  if (!phone) {
    resetHealthState();
    healthErrorMessage.value = "用户手机号缺失，请重新登录";
    showNotify({ type: "warning", message: healthErrorMessage.value, position: "top" });
    return;
  }

  isHealthLoading.value = true;
  healthErrorMessage.value = "";

  try {
    const response = await getHealthyAnalysisFromDB({ phone });

    if (!response.code || response.code !== 200) {
      throw new Error(response.message || "获取健康分析失败");
    }

    if (!response.data || !response.data.analysis) {
      resetHealthState();
      healthErrorMessage.value = response.message || "暂无健康分析记录";
      return;
    }

    const analysisTime = response.data.analysisTime || "";
    const parsedAnalysis = parseHealthAnalysis(response.data.analysis);
    healthResult.value = normalizeAnalysis(parsedAnalysis, analysisTime);
    healthAnalysisTime.value = analysisTime || "暂无分析时间";
  } catch (error) {
    resetHealthState();
    healthErrorMessage.value = error instanceof Error ? error.message : "获取健康分析失败";
    showNotify({ type: "danger", message: healthErrorMessage.value, position: "top" });
  } finally {
    isHealthLoading.value = false;
  }
};

const openFunctionPopup = (item: UserFunctionItem) => {
  activeFunction.value = item;
  if (item.id === 1) {
    fillUserForm();
  }
  showPopup.value = true;
  if (item.id === 2) {
    void loadHealthAnalysis();
  }
};

const handleBirthdayConfirm = ({ selectedValues }: { selectedValues: string[] }) => {
  userForm.birthday = selectedValues.join("-");
  showBirthdayPicker.value = false;
};

const handleUpdateUserInfo = async () => {
  if (isUpdating.value) {
    return;
  }

  if (typeof userInfo.value.id !== "number") {
    showNotify({ type: "warning", message: "用户信息缺失，请重新登录", position: "top" });
    return;
  }

  isUpdating.value = true;

  try {
    const response = await updateUserInfo({
      id: userInfo.value.id,
      name: userForm.name.trim(),
      phone: userForm.phone.trim(),
      gender: normalizeGender(userForm.gender),
      birthday: userForm.birthday,
      address: userForm.address.trim(),
      password: userForm.password,
    });

    if (!response.success) {
      throw new Error(response.message || "更新失败");
    }

    userInfo.value = {
      ...userInfo.value,
      name: userForm.name.trim(),
      phone: userForm.phone.trim(),
      gender: normalizeGender(userForm.gender),
      birthday: userForm.birthday,
      address: userForm.address.trim(),
    };
    localStorage.setItem("userInfo", JSON.stringify(userInfo.value));
    showPopup.value = false;
    showNotify({ type: "success", message: response.message || "更新成功", position: "top" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新失败，请稍后重试";
    showNotify({ type: "danger", message, position: "top" });
  } finally {
    isUpdating.value = false;
  }
};
</script>

<style scoped lang="scss">
.user-page {
  min-height: calc(100dvh - 50px);
  box-sizing: border-box;
  padding: 10px 10px 92px;
  background-color: #f0f8ff;
}

.userInfo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-width: 0;
  padding: 16px 12px;
  margin: 5px 0 0;
  border: 2px dashed #1487ecbd;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 8px 20px rgba(20, 135, 236, 0.12);

  .userAvatar {
    flex: 0 0 auto;
    padding: 4px;
    border-radius: 999px;
    background-color: #bed9f0bd;
  }

  .userName {
    min-width: 0;
    flex: 1;
    padding: 12px 14px;
    border-radius: 14px;
    background-color: #bed9f0bd;
    text-align: center;

    p {
      margin: 0;
      overflow-wrap: anywhere;
    }

    .name {
      font-size: 34px;
      line-height: 1.25;
      font-weight: 700;
      color: #0d5798;
    }

    .phone {
      margin-top: 8px;
      font-size: 24px;
      line-height: 1.35;
      color: #1e6ca8;
    }
  }
}

.user-setting {
  display: flex;
  flex-direction: column;
  margin: 46px 0 0;
  gap: 18px;

  .setting {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    min-height: 100px;
    box-sizing: border-box;
    border: 0;
    border-radius: 20px;
    padding: 14px 16px;
    background-color: #bed9f0bd;
    color: #0d5798;
    text-align: center;
    box-shadow: 0 6px 14px rgba(20, 135, 236, 0.1);
    transition: transform 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;

    &:active {
      transform: scale(0.98);
      background-color: rgba(174, 211, 238, 0.88);
      box-shadow: 0 3px 8px rgba(20, 135, 236, 0.12);
    }

    .setting-title {
      font-size: 34px;
      line-height: 1.25;
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    .setting-desc {
      font-size: 18px;
      line-height: 1.45;
      color: #2c77ad;
      overflow-wrap: anywhere;
    }
  }
}

.function-popup {
  background-color: transparent;
}

.popup-card {
  height: 85dvh;
  max-height: 85dvh;
  box-sizing: border-box;
  overflow-y: auto;
  padding: 0 16px calc(18px + env(safe-area-inset-bottom));
  background: #f0f8ff;
}

.popup-header {
  margin: 0 -16px;
  padding: 22px 48px 18px 18px;
  border-radius: 16px 16px 0 0;
  border-bottom: 2px dashed rgba(20, 135, 236, 0.32);
  background-color: #bed9f0bd;

  h2 {
    margin: 0;
    font-size: 34px;
    line-height: 1.25;
    color: #0d5798;
    font-weight: 800;
    overflow-wrap: anywhere;
  }

  p {
    margin: 8px 0 0;
    font-size: 20px;
    line-height: 1.5;
    color: #2c77ad;
    overflow-wrap: anywhere;
  }
}

.popup-content {
  margin-top: 18px;
  border: 2px dashed rgba(20, 135, 236, 0.32);
  border-radius: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.76);
  color: #155f9a;
  font-size: 22px;
  line-height: 1.7;
  overflow-wrap: anywhere;
  box-shadow: 0 6px 14px rgba(20, 135, 236, 0.08);
}

.user-form {
  margin-top: 18px;

  :deep(.van-cell-group--inset) {
    margin: 0;
    border: 2px dashed rgba(20, 135, 236, 0.32);
    border-radius: 16px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.76);
    box-shadow: 0 6px 14px rgba(20, 135, 236, 0.08);
  }

  :deep(.van-cell) {
    min-height: 62px;
    padding: 14px 16px;
    background: transparent;
  }

  :deep(.van-field__label) {
    width: 74px;
    color: #155f9a;
    font-size: 20px;
    line-height: 1.45;
  }

  :deep(.van-field__body) {
    min-height: 34px;
  }

  :deep(.van-field__control) {
    color: #0d5798;
    font-size: 20px;
    line-height: 1.45;
  }

  :deep(.van-field__control::placeholder) {
    color: #7da8ca;
    font-size: 20px;
  }

  :deep(.van-radio__label) {
    color: #0d5798;
    font-size: 20px;
    line-height: 1.45;
  }

  :deep(.van-field__error-message) {
    font-size: 16px;
    line-height: 1.45;
  }
}

.health-panel {
  margin-top: 18px;
  color: #155f9a;
  font-size: 20px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.health-loading,
.health-empty {
  border: 2px dashed rgba(20, 135, 236, 0.32);
  border-radius: 16px;
  padding: 22px 16px;
  background: rgba(255, 255, 255, 0.76);
  color: #155f9a;
  font-size: 22px;
  line-height: 1.6;
  text-align: center;
  box-shadow: 0 6px 14px rgba(20, 135, 236, 0.08);

  p {
    margin: 0;
  }
}

.health-result {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.health-card {
  border: 2px dashed rgba(20, 135, 236, 0.32);
  border-radius: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 6px 14px rgba(20, 135, 236, 0.08);

  p {
    margin: 10px 0 0;
    color: #155f9a;
    font-size: 20px;
    line-height: 1.6;
  }
}

.health-meta {
  margin-bottom: 12px;
  color: #2c77ad;
  font-size: 17px;
  line-height: 1.5;
}

.health-risk-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.health-card-title,
.health-section h3 {
  margin: 0;
  color: #0d5798;
  font-size: 22px;
  line-height: 1.35;
  font-weight: 800;
}

.prediction-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.prediction-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(190, 217, 240, 0.42);
  color: #0d5798;
  font-size: 20px;
  line-height: 1.4;
}

.health-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0 0;
  padding-left: 22px;
  color: #155f9a;
  font-size: 20px;
  line-height: 1.6;
}

.warning-list {
  color: #a74712;
}

.medicine-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.health-muted {
  color: #5f8fb7;
}

.health-status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.health-status-card {
  min-width: 0;
  border: 2px dashed rgba(20, 135, 236, 0.32);
  border-radius: 16px;
  padding: 14px;
  background: rgba(190, 217, 240, 0.5);
  box-shadow: 0 6px 14px rgba(20, 135, 236, 0.08);

  span,
  strong {
    display: block;
    overflow-wrap: anywhere;
  }

  span {
    color: #2c77ad;
    font-size: 16px;
    line-height: 1.4;
  }

  strong {
    margin-top: 6px;
    color: #0d5798;
    font-size: 22px;
    line-height: 1.35;
  }
}

.health-panel :deep(.van-tag) {
  max-width: 100%;
  white-space: normal;
  line-height: 1.35;
}

.popup-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 18px;

  .popup-action-btn {
    height: 54px;
    border: 0;
    background: #1487ecbd;
  }

  .popup-close-btn {
    height: 54px;
    background: rgba(255, 255, 255, 0.72);
  }

  :deep(.van-button__text) {
    font-size: 20px;
    font-weight: 700;
  }
}

@media (max-width: 360px) {
  .userInfo {
    align-items: stretch;

    .userAvatar {
      display: flex;
      align-items: center;
    }

    .userName {
      .name {
        font-size: 28px;
      }

      .phone {
        font-size: 20px;
      }
    }
  }

  .user-setting .setting .setting-title {
    font-size: 30px;
  }

  .popup-header {
    h2 {
      font-size: 30px;
    }

    p {
      font-size: 18px;
    }
  }

  .user-form {
    :deep(.van-cell) {
      padding: 12px 12px;
    }

    :deep(.van-field__label) {
      width: 64px;
      font-size: 18px;
    }

    :deep(.van-field__control),
    :deep(.van-field__control::placeholder),
    :deep(.van-radio__label) {
      font-size: 18px;
    }
  }

  .health-panel,
  .health-card p,
  .prediction-item,
  .health-list {
    font-size: 18px;
  }

  .health-loading,
  .health-empty,
  .health-card-title,
  .health-section h3,
  .health-status-card strong {
    font-size: 20px;
  }

  .health-status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
