// import { createRouter, createWebHistory } from 'vue-router'

// const router = createRouter({
//   history: createWebHistory(import.meta.env.BASE_URL),
//   routes: [],
// })

// export default router
import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../stores/user';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../view/Login.vue')
    },
    {
      path: '/',
      name: 'Home',
      component: () => import('../view/home.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
});

// // 路由守卫：检查登录状态
// router.beforeEach((to, from, next) => {
//   const userStore = useUserStore();
  
//   if (to.meta.requiresAuth && !userStore.token) {
//     next('/login');
//   } else {
//     next();
//   }
// });

// 路由守卫：检查登录状态
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  
  console.log('=== 路由守卫检查 ===', {
    路径: to.path,
    有Token: !!userStore.token,
    有用户信息: !!userStore.currentUser,
    用户: userStore.currentUser?.username
  });
  
  // 如果需要认证的页面
  if (to.meta.requiresAuth) {
    if (!userStore.token || !userStore.currentUser) {
      console.log('认证失败，跳转到登录页');
      next('/login');
    } else {
      console.log('认证通过，用户:', userStore.currentUser.username);
      next();
    }
  } 
  // 登录页面：如果已登录则跳转到首页
  else if (to.path === '/login') {
    if (userStore.token && userStore.currentUser) {
      console.log(' 已登录，跳转到首页');
      next('/');
    } else {
      next();
    }
  } 
  else {
    next();
  }
});

export default router;