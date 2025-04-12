<template>
  <div id="app">
    <header class="app-header">
      <h1>智能科技日历</h1>
      <nav class="main-nav">
        <router-link to="/">首页</router-link>
        <router-link to="/events">事件管理</router-link>
        <router-link to="/birthdays">生日提醒</router-link>
        <router-link to="/duty-roster">值日表</router-link>
        <router-link to="/admin" v-if="isAdmin">管理后台</router-link>
      </nav>
    </header>
    
    <main class="app-content">
      <router-view></router-view>
    </main>
    
    <footer class="app-footer">
      <p>&copy; 2025 智能科技日历系统</p>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      isAdmin: false
    }
  },
  created() {
    // 检查用户是否为管理员
    const token = localStorage.getItem('token');
    if (token) {
      // 这里可以添加验证token的逻辑
      // 简化版本，实际应用中应该从token中解析用户角色
      this.isAdmin = localStorage.getItem('userRole') === 'admin';
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f7fa;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: #409eff;
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin-bottom: 0.5rem;
}

.main-nav {
  display: flex;
  gap: 1.5rem;
}

.main-nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem 0;
  position: relative;
}

.main-nav a:after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background-color: white;
  transition: width 0.3s;
}

.main-nav a:hover:after,
.main-nav a.router-link-active:after {
  width: 100%;
}

.app-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.app-footer {
  background-color: #f0f2f5;
  padding: 1rem 2rem;
  text-align: center;
  color: #606266;
}

@media (max-width: 768px) {
  .app-header {
    padding: 1rem;
  }
  
  .main-nav {
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .app-content {
    padding: 1rem;
  }
}
</style>
