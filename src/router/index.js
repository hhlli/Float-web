import { createRouter, createWebHistory } from 'vue-router'
import { useSiteStore } from '@/store/site'

// 1. 分类预加载所有主题的视图文件映射
const themeViews = {
  PublicView: import.meta.glob('../themes/*/views/PublicView.vue'),
  ServerDetailView: import.meta.glob('../themes/*/views/ServerDetailView.vue')
}

const getThemeView = async (viewType) => {
  const store = useSiteStore()
  await store.fetchSettings()
  
  const theme = store.theme || 'default'
  const path = `../themes/${theme}/views/${viewType}.vue`
  const viewsMap = themeViews[viewType]
  
  // 命中对应主题组件
  if (viewsMap && viewsMap[path]) {
    return viewsMap[path]()
  }
  
  // 修正后的降级回退机制：从各自的映射表中获取 default 组件
  if (viewsMap && viewsMap[`../themes/default/views/${viewType}.vue`]) {
    return viewsMap[`../themes/default/views/${viewType}.vue`]()
  }

  throw new Error(`Component ${viewType} not found in theme ${theme} or default.`)
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Public',
      component: () => getThemeView('PublicView')
    },
    {
      path: '/server/:id',
      name: 'ServerDetail',
      component: () => getThemeView('ServerDetailView')
    },
    {
      path: '/oauth/callback',
      name: 'OAuthCallback',
      component: () => import('../views/OAuthCallback.vue')
    },
    {
      path: '/admin',
      name: 'Admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true },
      redirect: '/admin/servers', 
      children: [
        {
          path: 'servers', 
          name: 'AdminServers',
          component: () => import('../components/admin/servers/AdminServers.vue'),
          meta: { title: '服务器' }
        },
        {
          path: 'settings', 
          name: 'AdminSettings',
          component: () => import('../components/admin/AdminSettings.vue'),
          meta: { title: '系统设置' }
        },
        {
          path: 'theme', 
          name: 'AdminTheme',
          component: () => import('../components/admin/AdminTheme.vue'),
          meta: { title: '主题外观' }
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
          component: () => import('../components/admin/log-viewer/AdminLogs.vue'),
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

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('server_token')
  if (to.meta.requiresAuth && !token) {
    next('/')
  } else {
    next()
  }
})

export default router