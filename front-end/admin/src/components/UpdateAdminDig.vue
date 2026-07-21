<template>
  <el-dialog v-model="dialogVisible" title="更新确认" width="500" center @close="handleClose">
    <span> 确定要更新吗? </span>
    <el-form :model="adminInfo" :rules="rules" ref="formRef" label-width="120px">
      <el-form-item v-for="(value, key) in adminInfo" :key="key">
        <el-input v-if="key !== 'id'" v-model="adminInfo[key]" :type="key === 'password' ? 'password' : 'text'">
          <template #prepend>{{ key
            }}</template>
        </el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from "vue";
const rules = {};
const props = defineProps(["adminInfo", "visible"]);
const emit = defineEmits(["confirm", "update:visible"]);

const adminInfo = computed({
  get() {
    return props.adminInfo;
  },
  set(value) {
    props.adminInfo = value;
  },
});

const dialogVisible = computed({
  get() {
    return props.visible;
  },
  set(value) {
    emit("update:visible", value);
  },
});

const handleClose = () => {
  emit("update:visible", false);
};

const handleConfirm = () => {
  emit("confirm", adminInfo.value);
  emit("update:visible", false);
};
</script>

<style scoped lang="scss">
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 深度穿透修改 Element Plus 输入框前置插槽样式 */
:deep(.el-input-group__prepend) {
  /* 1. 设置固定宽度（根据你的需求调整，比如 80px/100px） */
  width: 90px;
  /* 2. 禁止被压缩（关键！ElInput 是 flex 布局，不设置会被挤变形） */
  flex-shrink: 0;
  /* 3. 文本居中/右对齐，更美观 */
  text-align: center;
}
</style>
