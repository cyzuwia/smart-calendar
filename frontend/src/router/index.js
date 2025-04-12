import { createRouter, createWebHistory } from 'vue-router'

// 导入视图组件
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '首页 - 智能科技日历' }
  },
  {
    path: '/events',
    name: 'Events',
    component: () => import('../views/EventsView.vue'),
    meta: { title: '事件管理 - 智能科技日历' }
  },
  {
    path: '/birthdays',
    name: 'Birthdays',
    component: () => import('../views/BirthdaysView.vue'),
    meta: { title: '生日提醒 - 智能科技日历' }
  },
  {
    path: '/duty-roster',
    name: 'DutyRoster',
    component: () => import('../views/DutyRosterView.vue'),
    meta: { title: '值日表 - 智能科技日历' }
  },
  {
    path: '/admin',
    name: 'AdminLogin',
    component: () => import('../views/admin/AdminLogin.vue'),
    meta: { title: '管理员登录 - 智能科技日历' }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('../views/admin/AdminDashboard.vue'),
    meta: { title: '管理后台 - 智能科技日历' },
    children: [
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('../views/admin/UserManagement.vue'),
        meta: { title: '用户管理 - 智能科技日历' }
      },
      {
        path: 'events',
        name: 'EventManagement',
        component: () => import('../views/admin/EventManagement.vue'),
        meta: { title: '事件管理 - 智能科技日历' }
      },
      {
        path: 'notifications',
        name: 'NotificationSettings',
        component: () => import('../views/admin/NotificationSettings.vue'),
        meta: { title: '通知设置 - 智能科技日历' }
      },
      {
        path: 'duty-roster',
        name: 'DutyRosterManagement',
        component: () => import('../views/admin/DutyRosterManagement.vue'),
        meta: { title: '值日表管理 - 智能科技日历' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫，设置页面标题
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  // 检查管理员路由权限
  if (to.path.startsWith('/admin/dashboard')) {
    const token = localStorage.getItem('token')
    const isAdmin = localStorage.getItem('userRole') === 'admin'
    
    if (!token || !isAdmin) {
      next('/admin')
      return
    }
  }
  
  next()
})

export default router
