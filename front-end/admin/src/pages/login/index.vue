<template>
  <div class="login-container">
    <div v-if="switchFormState" class="login-card">
      <div class="titleAndSwitch">
        <h2 class="login-title">管理员登录</h2>
        <button type="link" class="switch-btn" @click="switchForm">
          注册账号
        </button>
      </div>
      <el-form ref="loginFormRef" :model="loginForm" class="demo-ruleForm">
        <el-form-item prop="adminname">
          <el-input
            v-model="loginForm.adminname"
            placeholder="用户名"
            :prefix-icon="UserFilled"
          ></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            type="password"
            v-model="loginForm.password"
            placeholder="密码"
            :prefix-icon="Lock"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="handleLogin"
            >登录</el-button
          >
        </el-form-item>
      </el-form>
    </div>

    <div v-else class="login-card">
      <div class="titleAndSwitch">
        <h2 class="login-title">管理员注册</h2>
        <button type="link" class="switch-btn" @click="switchForm">
          登录账号
        </button>
      </div>
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        class="demo-ruleForm"
      >
        <el-form-item prop="adminname">
          <el-input
            v-model="registerForm.adminname"
            placeholder="用户名"
            :prefix-icon="UserFilled"
          ></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            type="password"
            v-model="registerForm.password"
            placeholder="密码"
            :prefix-icon="Lock"
          ></el-input>
        </el-form-item>
        <el-form-item prop="phone">
          <el-input
            v-model="registerForm.phone"
            placeholder="手机号"
            :prefix-icon="Phone"
          ></el-input>
        </el-form-item>
        <el-form-item prop="role">
          <el-select v-model="registerForm.role" placeholder="请选择角色">
            <el-option label="超级管理员" value="super_admin"></el-option>
            <el-option label="普通管理员" value="common_admin"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" @click="handleRegister"
            >注册</el-button
          >
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
// 引入图标组件
import { UserFilled, Lock, Phone } from "@element-plus/icons-vue";

import { login, register } from "@/api";
import router from "@/router";



const loginForm = reactive({
  adminname: "",
  password: "",
});

const registerForm = reactive({
  adminname: "",
  password: "",
  phone: "",
  role: "",
});

// 切换登录注册表单. true为登录, false为注册
const switchFormState = ref(true);

// 切换登录注册表单
const switchForm = () => {
  switchFormState.value = !switchFormState.value;
};

// 登录请求
const handleLogin = async () => {
  try {
    const {data} = await login(loginForm);
    console.log(data);
    localStorage.setItem("token", data.adminToken);
    localStorage.setItem("adminInfo", JSON.stringify(data.admin));
    router.push("/home");

  } catch (error) {
    console.log(error);
  }
};

// 注册请求
const handleRegister = async () => {
  try {
    const res = await register(registerForm);
    console.log(res);
  } catch (error) {
    console.log(error);
  }
};
</script>

<style lang="scss" scoped>
// 变量定义
$primary-color: #409eff;
$border-radius: 4px;
$card-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
$background-color: #f5f7fa;
$card-background: #ffffff;
$text-color: #303133;

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: $background-color;

  .login-card {
    width: 100%;
    max-width: 400px;
    padding: 30px;
    background-color: $card-background;
    border-radius: $border-radius * 2;
    box-shadow: $card-shadow;

    .login-title {
      text-align: center;
      margin-bottom: 24px;
      color: $text-color;
      font-size: 20px;
      font-weight: 600;
    }

    .demo-ruleForm {
      width: 100%;

      .login-btn {
        width: 100%;
        margin-top: 10px;
      }
    }
  }
}
</style>
