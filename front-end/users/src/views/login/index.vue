<template>
  <div class="container">
    <h1 style="margin: 0px auto 20px auto; text-align: center">智乡云 · 村民服务端</h1>
    <!-- 登录页 -->
    <div class="loginPage" v-if="loginSwitch">
      <van-nav-bar class="title-bar" title="欢迎登录" />
      <van-form @submit="onSubmitLogin">
        <van-cell-group inset>
          <van-field
            v-model="userLoginInfo.phone"
            name="phone"
            label="手机号"
            placeholder="请输入手机号"
            :rules="[{ required: true, message: '请填写手机号' }]"
          />
          <van-field
            v-model="userLoginInfo.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请填写密码' }]"
          />
        </van-cell-group>
        <div style="margin: 16px">
          <van-button round block type="primary" native-type="submit">
            提交
          </van-button>
        </div>
      </van-form>
      <van-button
        style="border: none; color: #007aff; margin-left: 16px;"
        size="small"
        @click="loginSwitch = false"
      >
        还没有账号？去注册
      </van-button>
    </div>
    <!-- 注册页 -->
    <div class="registerPage" v-else>
      <van-nav-bar class="title-bar" title="欢迎注册" />
      <van-form @submit="onSubmitRegister">
        <van-cell-group inset>
          <van-field
            v-model="userRegisterInfo.phone"
            name="phone"
            label="手机号"
            placeholder="请输入手机号"
            :rules="[{ required: true, message: '请填写手机号' }]"
          />
          <van-field
            v-model="userRegisterInfo.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请填写密码' }]"
          />
          <van-field
            v-model="userRegisterInfo.name"
            name="name"
            label="姓名"
            placeholder="请输入姓名"
            :rules="[{ required: true, message: '请填写姓名' }]"
          />
          <van-field name="radio" label="单选框">
            <template #input>
              <van-radio-group
                v-model="userRegisterInfo.gender"
                direction="horizontal"
              >
                <van-radio name="0">男</van-radio>
                <van-radio name="1">女</van-radio>
              </van-radio-group>
            </template>
          </van-field>
          <van-field
            v-model="userRegisterInfo.birthday"
            is-link
            readonly
            name="datePicker"
            label="时间选择"
            placeholder="点击选择时间"
            @click="showPicker = true"
          />

          <van-field
            v-model="userRegisterInfo.address"
            name="address"
            label="地址"
            placeholder="具体到组及门牌号"
            :rules="[{ required: true, message: '请填写地址' }]"
          />
          <van-popup v-model:show="showPicker" position="bottom">
            <van-date-picker
              @confirm="onConfirm"
              @cancel="showPicker = false"
              :min-date="new Date('1900-01-01')"
              :max-date="new Date('2000-12-31')"
            />
          </van-popup>
        </van-cell-group>
        <div style="margin: 16px">
          <van-button round block type="primary" native-type="submit">
            提交
          </van-button>
        </div>
      </van-form>
      <van-button
        style="border: none; color: #007aff; margin-left: 16px;"
        size="small"
        @click="loginSwitch = true"
      >
        已有账号？去登录
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { login, register } from "@/api/modules/auth";
import { showNotify } from "vant";

// 登录数据接口
interface UserLoginInfo {
  phone: string;
  password: string;
}

// 注册数据接口
interface UserRegisterInfo {
  phone: string;
  password: string;
  name: string;
  gender: number; // 匹配数据库 INTEGER，0男，1女
  birthday: string; // 日期字符串（YYYY-MM-DD），匹配数据库 DATE
  address: string;
}

const router = useRouter();

const userLoginInfo = reactive<UserLoginInfo>({
  phone: "",
  password: "",
});

const userRegisterInfo = reactive<UserRegisterInfo>({
  phone: "",
  password: "",
  name: "",
  gender: 0,
  birthday: "",
  address: "",
});

// 用于登录和注册界面的切换
const loginSwitch = ref(false);

// 登录请求
const onSubmitLogin = async () => {
  const res = await login(userLoginInfo);
  console.log("登录返回的数据:", res);
  if (res.code === 200) {
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("userInfo", JSON.stringify(res.data.userInfo));
    showNotify({ message: "登录成功", position: "top" });
    // 登录成功后跳转到主页面
    router.push("/home");
  } else {
    showNotify({ message: "用户名或密码错误", position: "top" });
  }
};

const showPicker = ref(false);
const onConfirm = ({ selectedValues }: { selectedValues: string[] }) => {
  userRegisterInfo.birthday = selectedValues.join("-");
  showPicker.value = false;
  console.log(userRegisterInfo.birthday);
};

// 注册请求
const onSubmitRegister = async () => {
  const res = await register(userRegisterInfo);
  console.log("注册返回的数据:", res);
  if (res.code === 200) {
    showNotify({ message: "注册成功", position: "top" });
    loginSwitch.value = true;
  } else {
    showNotify({ message: "注册失败", position: "top" });
  }
};
</script>

<style scoped lang="scss">

.container {
  padding: 20px 0 0 0;
}

.title-bar {
  margin: 0 16px 10px 16px;
}
</style>
