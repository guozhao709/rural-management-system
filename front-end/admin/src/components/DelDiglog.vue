<template>
  <el-dialog
    v-model="dialogVisible"
    title="删除确认"
    width="500"
    center
    @close="handleClose"
  >
    <span>
      确定要删除
      <strong>{{ adminInfo?.adminname }}</strong> 吗？此操作不可恢复。
    </span>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  adminInfo: {
    type: Object,
    default: () => ({}),
  },
});


const emit = defineEmits(["update:visible", "confirm"]);

const dialogVisible = computed({
  get() {
    return props.visible;
  },
  set(value) {
    emit("update:visible", value);
  },
});

const handleCancel = () => {
  emit("update:visible", false);
};

const handleConfirm = () => {
  emit("confirm", props.adminInfo);
  emit("update:visible", false);
};

const handleClose = () => {
  emit("update:visible", false);
};
</script>

<style scoped lang="scss">
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
