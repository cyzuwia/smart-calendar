<template>
  <div class="admin-login">
    <div class="login-container">
      <div class="login-header">
        <h2>管理员登录</h2>
        <p>智能科技日历系统</p>
      </div>
      
      <el-form :model="loginForm" :rules="loginRules" ref="loginForm" class="login-form">
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            prefix-icon="el-icon-user" 
            placeholder="用户名"
            @keyup.enter="handleLogin"
          ></el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            prefix-icon="el-icon-lock" 
            type="password" 
            placeholder="密码"
            @keyup.enter="handleLogin"
          ></el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading" 
            class="login-button" 
            @click="handleLogin"
          >登录</el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>© 2025 智能科技日历系统 - 管理后台</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminLogin',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loginRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
        ]
      },
      loading: false
    };
  },
  methods: {
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true;
          
          // 模拟API请求
          setTimeout(() => {
            // 这里应该调用实际的登录API
            if (this.loginForm.username === 'admin' && this.loginForm.password === 'admin123') {
              // 登录成功
              this.$message.success('登录成功');
              
              // 存储token和用户信息
              localStorage.setItem('admin_token', 'mock_token_123456');
              localStorage.setItem('admin_user', JSON.stringify({
                id: 1,
                username: 'admin',
                is_admin: true
              }));
              
              // 跳转到管理员仪表板
              this.$router.push('/admin/dashboard');
            } else {
              // 登录失败
              this.$message.error('用户名或密码错误');
            }
            
            this.loading = false;
          }, 1000);
        } else {
          return false;
        }
      });
    }
  }
};
</script>

<style scoped>
.admin-login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.login-container {
  width: 400px;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.login-header p {
  margin: 10px 0 0;
  font-size: 14px;
  color: #909399;
}

.login-form {
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
}

.login-footer {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .login-container {
    width: 90%;
    padding: 20px;
  }
}
</style>
