import { createRouter, createWebHistory } from 'vue-router'
import { useSiteStore } from '@/store/site'

// 1. 分类预加载所有主题的视图文件映射
// 仅保留内置主题的静态映射
const builtinThemes = {
  default: {
    PublicView: () => import('../themes/default/views/PublicView.vue'),
    ServerDetailView: () => import('../themes/default/views/ServerDetailView.vue')
  },
  matrix: {
    PublicView: () => import('../themes/matrix/views/PublicView.vue')
    // 注意：matrix 主题没有 ServerDetailView.vue，所以这里不写，依靠下方逻辑降级
  }
}

const getThemeView = async (viewType) => {
  const store = useSiteStore()
  await store.fetchSettings()
  
  const theme = store.theme || 'default'
  
  // 内置主题：正常挂载 Vue 组件
  if (builtinThemes[theme]) {
    // 优先加载当前主题的对应视图
    if (builtinThemes[theme][viewType]) {
      return builtinThemes[theme][viewType]()
    }
    // 降级机制：如果当前主题缺少该视图（如 matrix 缺少 ServerDetailView），则使用 default 的对应视图
    if (builtinThemes['default'][viewType]) {
      return builtinThemes['default'][viewType]()
    }
  }
  
  // 第三方主题：让出前端路由控制权，强制浏览器发起请求以获取后端的独立 HTML
  window.location.href = window.location.pathname
  return { template: '<div></div>' }
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
          path: 'extensions', 
          name: 'AdminExtensions',
          component: () => import('../components/admin/extensions/AdminExtensions.vue'),
          meta: { title: '拓展管理' }
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