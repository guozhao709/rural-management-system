<template>
  <el-table :data="tableData" style="width: 100%; height: 100%">
    <el-table-column prop="adminID" label="Admin ID" width="150" />
    <el-table-column prop="adminname" label="Admin Name" width="200" />
    <el-table-column prop="password" label="Password" width="200" />
    <el-table-column prop="phone" label="Phone" width="200" />
    <el-table-column prop="role" label="Role" width="200" />

    <el-table-column fixed="right" label="Operations" min-width="120">
      <template #default="scope">
        <el-button link size="large" type="primary" @click="handleUpdateClick(scope.row)"
          >Edit</el-button
        >
        <el-button link size="large" type="danger" @click="handleDeleteClick(scope.row)"
          >Delete</el-button
        >
      </template>
    </el-table-column>
  </el-table>

  <DelDiglog
    v-model:visible="delDialogVisible"
    :adminInfo="currentAdmin"
    @confirm="handleConfirmDelete"
  />

  <UpdateAdminDig
  v-model:visible="updateDialogVisible"
  :adminInfo="currentAdmin"
  @confirm="handleConfirmUpdate"
  />
</template>

<script setup>
import { getAdminList, deleteAdmin, updateAdmin } from "@/api";
import DelDiglog from "@/components/DelDiglog.vue";
import UpdateAdminDig from "@/components/UpdateAdminDig.vue";
import { ref, onMounted } from "vue";

const tableData = ref([]);
const delDialogVisible = ref(false);
const updateDialogVisible = ref(false);
const currentAdmin = ref({});

onMounted(async () => {
  getAdminTable();
});

// 获取管理员列表(后端通信)
const getAdminTable = async () => {
  const {data} = await getAdminList();
  tableData.value = data;
};

// 删除管理员信息(点击事件)
const handleDeleteClick = (adminInfo) => {
  currentAdmin.value = adminInfo;
  delDialogVisible.value = true;
};

// 删除管理员信息(后端通信)
const handleConfirmDelete = async (adminInfo) => {
  const { adminID } = adminInfo;
  const  data  = await deleteAdmin({ adminID });
  if (data.code === 200) {
    getAdminTable();
  }
};

// 更新管理员信息(点击事件)
const handleUpdateClick = (adminInfo) => {
  currentAdmin.value = adminInfo;
  updateDialogVisible.value = true;
};

// 更新管理员信息(后端通信)
const handleConfirmUpdate = async (adminInfo) =>{
  const  data  = await updateAdmin(adminInfo);
  if (data.code === 200) {
    getAdminTable();
  }
}
</script>
