import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Public',
      component: () => import('../views/PublicView.vue')
    },
    // 🌟 新增：独立服务器详情页路由
    {
      path: '/server/:id',
      name: 'ServerDetail',
      component: () => import('../views/ServerDetailView.vue')
    },

    {
      path: '/admin',
      name: 'Admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true },
      // 🌟 新增：访问 /admin 时，默认重定向到服务器列表
      redirect: '/admin/servers', 
      // 🌟 新增：嵌套子路由
      // 🌟 新增：嵌套子路由
      children: [
        {
          path: 'servers', 
          name: 'AdminServers',
          component: () => import('../components/admin/servers/AdminServers.vue'),
          meta: { title: '服务器' } // 🌟 新增标题元数据
        },
        {
          path: 'settings', 
          name: 'AdminSettings',
          component: () => import('../components/admin/AdminSettings.vue'),
          meta: { title: '系统设置' }
        },
        {
          path: 'latency',
          name: 'AdminLatency',
          component: () => import('../components/admin/AdminLatency.vue'),
          meta: { title: '延迟监测' }
        },
        {
          path: 'logs',
          name: 'AdminLogs',
          component: () => import('../components/admin/logs/AdminLogs.vue'),
          meta: { title: '系统日志' }
        }, 
        {
          path: 'docs',
          name: 'AdminDocs',
          component: () => import('../components/admin/AdminDocs.vue'),
          meta: { title: '使用文档' }
        },
        {
          path: 'about',
          name: 'AdminAbout',
          component: () => import('../components/admin/AdminAbout.vue'),
          meta: { title: '关于' }
        }
      ]
    }
  ]
})

// 路由守卫保持你原来完美的逻辑，完全不变
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('server_token')
  
  if (to.meta.requiresAuth && !token) {
    console.log('路由拦截：无 token 访问 admin')
    next('/')
  } else if (to.path === '/' && token) {
    next('/admin')
  } else {
    next()
  }
})

export default router