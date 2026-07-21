<template>
  <div class="article-container">
    <!-- 搜索/筛选栏 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索文章标题..."
        clearable
        style="width: 220px; margin-right: 10px"
        @keyup.enter="handleSearch"
      />
      <el-input
        v-model="searchCategory"
        placeholder="分类筛选..."
        clearable
        style="width: 180px; margin-right: 10px"
      />
      <el-select
        v-model="searchStatus"
        placeholder="发布状态"
        clearable
        style="width: 140px; margin-right: 10px"
      >
        <el-option label="全部" :value="undefined" />
        <el-option label="已发布" :value="1" />
        <el-option label="草稿" :value="0" />
      </el-select>
      <el-button type="primary" @click="handleSearch">
        <el-icon style="margin-right: 4px"><Search /></el-icon>搜索
      </el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button type="success" style="margin-left: auto" @click="handleCreate">
        <el-icon style="margin-right: 4px"><Plus /></el-icon>新建文章
      </el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" style="width: 100%; margin-bottom: 15px" v-loading="loading">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="category" label="分类" width="120" />
      <el-table-column label="轮播" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.isBanner === 1 ? 'success' : 'info'" size="small">
            {{ scope.row.isBanner === 1 ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="置顶" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.isTop === 1 ? 'warning' : 'info'" size="small">
            {{ scope.row.isTop === 1 ? '置顶' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'info'" size="small">
            {{ scope.row.status === 1 ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="views" label="浏览" width="70" align="center" />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column fixed="right" label="操作" width="140">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="handleEdit(scope.row)">
            编辑
          </el-button>
          <el-button link type="danger" size="small" @click="handleDelete(scope.row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      @size-change="getTableList"
      @current-change="getTableList"
      layout="total, sizes, prev, pager, next, jumper"
      :page-sizes="[10, 15, 20, 50, 100]"
      style="text-align: right"
    />

    <!-- 新建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑文章' : '新建文章'"
      width="700px"
      top="5vh"
      @close="handleDialogClose"
    >
      <el-form :model="form" ref="formRef" :rules="formRules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文章标题" />
        </el-form-item>
        <el-form-item label="摘要" prop="summary">
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="2"
            placeholder="请输入文章摘要（选填）"
          />
        </el-form-item>
        <el-form-item label="正文" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="8"
            placeholder="请输入文章正文"
          />
        </el-form-item>
        <el-form-item label="封面图" prop="cover">
          <el-input v-model="form.cover" placeholder="请输入封面图片URL（选填）" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-input v-model="form.category" placeholder="请输入文章分类（选填）" />
        </el-form-item>
        <el-form-item label="轮播展示">
          <el-switch
            v-model="form.isBanner"
            :active-value="1"
            :inactive-value="0"
            active-text="是"
            inactive-text="否"
          />
        </el-form-item>
        <el-form-item label="置顶">
          <el-switch
            v-model="form.isTop"
            :active-value="1"
            :inactive-value="0"
            active-text="置顶"
            inactive-text="否"
          />
        </el-form-item>
        <el-form-item label="发布状态">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            active-text="已发布"
            inactive-text="草稿"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? '保存修改' : '创建文章' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
  getArticleList,
  createArticle,
  updateArticle,
  deleteArticle,
} from "@/api/index.js";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Plus } from "@element-plus/icons-vue";

// --- 分页 & 表格 ---
const page = ref(1);
const pageSize = ref(15);
const total = ref(0);
const tableData = ref([]);
const loading = ref(false);

// --- 搜索 ---
const searchKeyword = ref("");
const searchCategory = ref("");
const searchStatus = ref(undefined);

// --- 对话框 ---
const dialogVisible = ref(false);
const isEdit = ref(false);
const editingId = ref(null);
const submitting = ref(false);
const formRef = ref(null);

const emptyForm = () => ({
  title: "",
  summary: "",
  content: "",
  cover: "",
  category: "",
  isBanner: 0,
  isTop: 0,
  status: 1,
});

const form = ref(emptyForm());

const formRules = {
  title: [{ required: true, message: "请输入文章标题", trigger: "blur" }],
  content: [{ required: true, message: "请输入文章正文", trigger: "blur" }],
};

// --- 获取列表 ---
const getTableList = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
    };
    if (searchKeyword.value) params.keyword = searchKeyword.value;
    if (searchCategory.value) params.category = searchCategory.value;
    if (searchStatus.value !== undefined && searchStatus.value !== "") {
      params.status = searchStatus.value;
    }

    const res = await getArticleList(params);
    tableData.value = res.data.list;
    total.value = res.data.total;
  } catch (error) {
    console.error("获取文章列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// --- 搜索 & 重置 ---
const handleSearch = () => {
  page.value = 1;
  getTableList();
};

const handleReset = () => {
  searchKeyword.value = "";
  searchCategory.value = "";
  searchStatus.value = undefined;
  page.value = 1;
  getTableList();
};

// --- 新建 ---
const handleCreate = () => {
  isEdit.value = false;
  editingId.value = null;
  form.value = emptyForm();
  dialogVisible.value = true;
};

// --- 编辑 ---
const handleEdit = (row) => {
  isEdit.value = true;
  editingId.value = row.id;
  form.value = {
    title: row.title || "",
    summary: row.summary || "",
    content: row.content || "",
    cover: row.cover || "",
    category: row.category || "",
    isBanner: row.isBanner ?? 0,
    isTop: row.isTop ?? 0,
    status: row.status ?? 1,
  };
  dialogVisible.value = true;
};

// --- 提交 ---
const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateArticle(editingId.value, form.value);
      ElMessage.success("文章更新成功");
    } else {
      await createArticle(form.value);
      ElMessage.success("文章创建成功");
    }
    dialogVisible.value = false;
    getTableList();
  } catch (error) {
    console.error("保存文章失败:", error);
  } finally {
    submitting.value = false;
  }
};

// --- 删除 ---
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文章「${row.title}」吗？此操作不可恢复。`,
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
    await deleteArticle(row.id);
    ElMessage.success("文章已删除");
    getTableList();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除文章失败:", error);
    }
  }
};

// --- 对话框关闭 ---
const handleDialogClose = () => {
  formRef.value?.resetFields();
};

// --- 初始化 ---
onMounted(() => {
  getTableList();
});
</script>

<style lang="scss" scoped>
.article-container {
  height: 100%;
}

.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
