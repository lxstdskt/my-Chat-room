<template>
  <div class="login-container">
    <div class="login-form">
      <h2>欢迎使用聊天室</h2>
      
      <!-- 提示信息 -->
      <div class="alert" :class="alertType" v-if="showAlert">
        {{ alertMessage }}
      </div>
      
      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="form.username"
            name="username"
            label="用户名"
            placeholder="请输入用户名"
            :rules="[{ required: true, message: '请填写用户名' }]"
          />
          <van-field
            v-model="form.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请填写密码' }]"
          />
          <van-field
            v-if="!isLogin"
            v-model="form.confirmPassword"
            type="password"
            name="confirmPassword"
            label="确认密码"
            placeholder="请再次输入密码"
            :rules="[{ required: !isLogin, message: '请确认密码' }]"
          />
        </van-cell-group>
        
        <div style="margin: 16px;">
          <van-button 
            round 
            block 
            type="primary" 
            native-type="submit"
            :loading="loading"
          >
            {{ isLogin ? '登录' : '注册' }}
          </van-button>
          
          <div class="switch-mode">
            <span @click="toggleMode">
              {{ isLogin ? '没有账号？点击注册' : '已有账号？点击登录' }}
            </span>
          </div>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { useUserStore } from '../stores/user';
import axios from 'axios';

const router = useRouter();
const userStore = useUserStore();

const isLogin = ref(true);
const loading = ref(false);
const showAlert = ref(false);
const alertMessage = ref('');
const alertType = ref('');

const form = reactive({
  username: '',
  password: '',
  confirmPassword: ''
});

// 显示提示信息
const showAlertMessage = (message: string, type: 'success' | 'error') => {
  alertMessage.value = message;
  alertType.value = type;
  showAlert.value = true;
  
  setTimeout(() => {
    showAlert.value = false;
  }, 3000);
};

// 切换登录/注册模式
const toggleMode = () => {
  isLogin.value = !isLogin.value;
  showAlert.value = false;
  form.confirmPassword = '';
};

// 前端验证
const validateForm = (): boolean => {
  // 验证用户名长度
  if (form.username.length <= 0) {
    showAlertMessage('用户名长度不能小于零', 'error');
    return false;
  }

  // 验证密码长度
  if (form.password.length !== 6) {
    showAlertMessage('密码长度必须为六位', 'error');
    return false;
  }

  // 注册时验证确认密码
  if (!isLogin.value && form.password !== form.confirmPassword) {
    showAlertMessage('两次输入的密码不一致', 'error');
    return false;
  }

  return true;
};

const onSubmit = async () => {
  // 先进行前端验证
  if (!validateForm()) {
    return;
  }

  loading.value = true;
  showAlert.value = false;
  
  try {
    const baseURL = 'http://localhost:3000/api';
    const url = isLogin.value ? `${baseURL}/auth/login` : `${baseURL}/auth/register`;
    
    // 准备发送的数据（注册时不需要发送confirmPassword）
    const requestData = isLogin.value 
      ? { username: form.username, password: form.password }
      : { username: form.username, password: form.password };
    
    const response = await axios.post(url, requestData);
    
    // const { access_token, user } = response.data;
    
    // // 保存用户信息和token
    // userStore.setUser(user, access_token);

    const { access_token, user } = response.data;

console.log('登录返回的数据:', response.data); // 这行是为了调试

// 保存用户信息和token到 store
userStore.setUser(user, access_token);

// 重要：同时保存到 localStorage，供 WebSocket 连接使用
localStorage.setItem('token', access_token);
if (user) {
  localStorage.setItem('user', JSON.stringify(user));
  console.log('用户信息已保存到 localStorage:', user);
} else {
  // 如果后端没有返回 user 信息，手动创建
  const userInfo = {
    id: Date.now(), // 临时ID
    username: form.username
  };
  localStorage.setItem('user', JSON.stringify(userInfo));
  console.log('手动创建用户信息:', userInfo);
}
    
    // 显示成功提示
    showAlertMessage(`${isLogin.value ? '登录' : '注册'}成功！`, 'success');
    
    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      router.push('/');
    }, 1500);
    
  } catch (error) {
    // 处理特定的错误消息 - 修复了类型注解问题
    let errorMessage = '操作失败';
    
    // 使用类型断言来处理error
    const axiosError = error as any;
    
    if (axiosError.response?.data?.message) {
      const serverMessage = axiosError.response.data.message;
      
      // 根据服务器返回的消息显示对应的中文提示
      if (serverMessage.includes('already exists') || serverMessage.includes('已存在')) {
        errorMessage = '此用户名已被使用，请重新建立账户';
      } else if (serverMessage.includes('Invalid credentials') || serverMessage.includes('无效')) {
        errorMessage = '用户名或密码错误';
      } else {
        errorMessage = serverMessage;
      }
    }
    
    showAlertMessage(errorMessage, 'error');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form {
  width: 90%;
  max-width: 400px;
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  position: relative;
}

.login-form h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.switch-mode {
  text-align: center;
  margin-top: 15px;
}

.switch-mode span {
  color: #1989fa;
  cursor: pointer;
  font-size: 14px;
}

/* 提示信息样式 */
.alert {
  padding: 12px;
  margin-bottom: 20px;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
}

.alert.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>