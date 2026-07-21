<template>
  <!-- 表格 -->
  <el-table :data="tableData" style="width: 100%; margin-bottom: 15px;">
    <el-table-column prop="id" label="ID" width="100" />
    <el-table-column prop="phone" label="手机号" width="180" />
    <el-table-column prop="password" label="密码" width="140" />
    <el-table-column prop="name" label="姓名" width="140" />
    <el-table-column label="性别" width="120">
      <template #default="scope">
        {{ formatGender(scope.row.gender) }}
      </template>
    </el-table-column>
    <el-table-column prop="birthday" label="出生日期" width="160" />
    <el-table-column prop="address" label="地址" width="180" />
    <el-table-column prop="create_time" label="创建时间" min-width="200" />
    <el-table-column fixed="right" label="Operations" min-width="120">
      <template #default="scope">
        <el-button link size="large" type="primary" @click="handleUpdateClick(scope.row)">Edit</el-button>
        <el-button link size="large" type="danger" @click="handleDeleteClick(scope.row)">Delete</el-button>
      </template>
    </el-table-column>
  </el-table>

  <!-- 👇 新增：Element Plus 分页组件 -->
  <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" @size-change="getTableList"
    @current-change="getTableList" layout="total, sizes, prev, pager, next, jumper" :page-sizes="[10, 15, 20, 50, 100]"
    style="text-align: right;" />

  <UpdateAdminDig v-model:visible="updateDialogVisible" :adminInfo="currentAdmin" @confirm="handleConfirmUpdate" />
</template>

<script setup>
import { ref, onMounted } from "vue"
import { getVillagersList, deleteVillager, updateVillager } from "@/api/index.js"
import { ElMessage, ElMessageBox } from 'element-plus'
import UpdateAdminDig from "@/components/UpdateAdminDig.vue"

// 分页核心参数
const page = ref(1) // 当前页码
const pageSize = ref(15) // 每页条数
const total = ref(0) // 总数据量
const tableData = ref([]) // 表格数据

const updateDialogVisible = ref(false);
const currentAdmin = ref({});

const handleUpdateClick = (adminInfo) => {
  currentAdmin.value = adminInfo;
  updateDialogVisible.value = true;
};

const handleConfirmUpdate = async (adminInfo) => {
  const data = await updateVillager(adminInfo);
  if (data.message === 'OK') {
    getTableList();
  }
}

// 格式化性别
const formatGender = (gender) => {
  return gender === 1 ? "男" : "女"
}

// 获取分页列表函数
const getTableList = async () => {
  try {
    // 传递分页参数给后端
    const res = await getVillagersList({
      page: page.value,
      pageSize: pageSize.value
    })
    // 关键：赋值表格数据 + 总条数
    tableData.value = res.data.list
    total.value = res.data.total
    console.log("分页数据：", res.data)
  } catch (error) {
    console.error("获取村民列表失败:", error)
  }
}

// 删除村民信息
const handleDeleteClick = async (villagerInfo) => {

  try {
    await ElMessageBox.confirm(
      'This operation will permanently delete the information. Continue?',
      'Warning',
      {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )
    const res = await deleteVillager(villagerInfo.id)
    if (res.message === 'OK') {
      ElMessage.success('Delete completed')
      getTableList()
    }
  } catch (error) {
    ElMessage.info('Delete canceled')
  }
}

// 页面加载时请求第一页数据
onMounted(() => {
  getTableList()
})
</script>