<template>
  <van-config-provider>
    <router-view />
  </van-config-provider>
</template>

<script setup lang="ts">
import { useUserStore } from './stores/user';

const userStore = useUserStore();

// 使用立即执行函数替代onMounted
(() => {
  userStore.initFromStorage();
})();
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #f5f5f5;
}
</style>