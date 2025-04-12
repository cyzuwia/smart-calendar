<template>
  <div class="admin-dashboard">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="250px" class="sidebar">
        <div class="logo">
          <h2>智能科技日历</h2>
          <p>管理后台</p>
        </div>
        
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          background-color="#2c3e50"
          text-color="#fff"
          active-text-color="#3498db"
          router
        >
          <el-menu-item index="/admin/dashboard">
            <i class="el-icon-s-home"></i>
            <span>仪表盘</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/users">
            <i class="el-icon-user"></i>
            <span>用户管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/events">
            <i class="el-icon-date"></i>
            <span>事件管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/birthdays">
            <i class="el-icon-present"></i>
            <span>生日管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/duty-roster">
            <i class="el-icon-s-order"></i>
            <span>值日表管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/notifications">
            <i class="el-icon-bell"></i>
            <span>通知设置</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/system">
            <i class="el-icon-setting"></i>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <!-- 主内容区 -->
      <el-container>
        <!-- 顶部导航 -->
        <el-header class="header">
          <div class="header-left">
            <i class="el-icon-s-fold toggle-sidebar" @click="toggleSidebar"></i>
            <breadcrumb />
          </div>
          
          <div class="header-right">
            <el-dropdown trigger="click" @command="handleCommand">
              <span class="user-dropdown">
                管理员 <i class="el-icon-arrow-down"></i>
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </el-header>
        
        <!-- 内容区 -->
        <el-main class="main-content">
          <router-view />
        </el-main>
        
        <!-- 页脚 -->
        <el-footer class="footer">
          <p>© 2025 智能科技日历系统 - 管理后台</p>
        </el-footer>
      </el-container>
    </el-container>
  </div>
</template>

<script>
export default {
  name: 'AdminDashboard',
  components: {
    Breadcrumb: {
      render(h) {
        return h('div', { class: 'breadcrumb' }, '仪表盘');
      }
    }
  },
  data() {
    return {
      activeMenu: '/admin/dashboard',
      isCollapse: false
    };
  },
  created() {
    // 检查是否已登录
    const token = localStorage.getItem('admin_token');
    if (!token) {
      this.$router.push('/admin/login');
    }
    
    // 设置当前活动菜单
    this.activeMenu = this.$route.path;
  },
  methods: {
    toggleSidebar() {
      this.isCollapse = !this.isCollapse;
    },
    handleCommand(command) {
      if (command === 'logout') {
        this.logout();
      } else if (command === 'profile') {
        this.$router.push('/admin/profile');
      } else if (command === 'password') {
        this.$router.push('/admin/change-password');
      }
    },
    logout() {
      this.$confirm('确定要退出登录吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 清除登录信息
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        
        // 跳转到登录页
        this.$router.push('/admin/login');
        
        this.$message({
          type: 'success',
          message: '已成功退出登录'
        });
      }).catch(() => {
        // 取消退出
      });
    }
  }
};
</script>

<style scoped>
.admin-dashboard {
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background-color: #2c3e50;
  color: white;
  height: 100vh;
  overflow-y: auto;
  transition: width 0.3s;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.logo p {
  margin: 5px 0 0;
  font-size: 12px;
  opacity: 0.7;
}

.sidebar-menu {
  border-right: none;
}

.header {
  background-color: white;
  border-bottom: 1px solid #dfe4ea;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
}

.toggle-sidebar {
  font-size: 20px;
  margin-right: 20px;
  cursor: pointer;
}

.breadcrumb {
  font-size: 16px;
  font-weight: 500;
}

.user-dropdown {
  cursor: pointer;
  font-size: 14px;
}

.main-content {
  background-color: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}

.footer {
  background-color: white;
  border-top: 1px solid #dfe4ea;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  height: 50px;
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    z-index: 1000;
  }
  
  .sidebar.collapsed {
    width: 0;
  }
}
</style>
