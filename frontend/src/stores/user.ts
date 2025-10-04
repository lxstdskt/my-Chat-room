import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { User } from '@/types/chat';

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null);
  const token = ref<string | null>(null);

  const setUser = (user: User, userToken: string) => {
    currentUser.value = user;
    token.value = userToken;
    localStorage.setItem('token', userToken);
  };

  const logout = () => {
    currentUser.value = null;
    token.value = null;
    localStorage.removeItem('token');
  };

  // // 从localStorage恢复登录状态
  // const initFromStorage = () => {
  //   const savedToken = localStorage.getItem('token');
  //   if (savedToken) {
  //     token.value = savedToken;
  //     // 这里可以添加API请求获取用户信息
  //   }
  // };

// 从localStorage恢复登录状态
const initFromStorage = () => {
  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('user');
  
  console.log('从存储恢复:', { savedToken: !!savedToken, savedUser: !!savedUser });
  
  if (savedToken && savedUser) {
    try {
      token.value = savedToken;
      currentUser.value = JSON.parse(savedUser);
      console.log('恢复的用户信息:', currentUser.value);
    } catch (error) {
      console.error('恢复用户信息失败:', error);
      // 恢复失败时清除状态
      currentUser.value = null;
      token.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  } else {
    // 如果没有完整信息，清除状态
    currentUser.value = null;
    token.value = null;
  }
};

  return {
    currentUser,
    token,
    setUser,
    logout,
    initFromStorage,
  };
});