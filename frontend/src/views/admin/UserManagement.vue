<template>
  <div class="user-management">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="showAddUserDialog">添加用户</el-button>
    </div>
    
    <!-- 用户列表 -->
    <el-card class="user-list">
      <el-table :data="users" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="email" label="邮箱" width="220" />
        <el-table-column label="管理员" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.is_admin ? 'success' : 'info'">
              {{ scope.row.is_admin ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" @click="editUser(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteUser(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
        />
      </div>
    </el-card>
    
    <!-- 添加/编辑用户对话框 -->
    <el-dialog :title="isEdit ? '编辑用户' : '添加用户'" v-model="dialogVisible" width="500px">
      <el-form :model="userForm" :rules="userRules" ref="userForm" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword" v-if="!isEdit">
          <el-input v-model="userForm.confirmPassword" type="password" placeholder="请再次输入密码" />
        </el-form-item>
        
        <el-form-item label="管理员权限">
          <el-switch v-model="userForm.is_admin" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveUser" :loading="saveLoading">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'UserManagement',
  data() {
    // 密码确认验证
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.userForm.password) {
        callback(new Error('两次输入的密码不一致'));
      } else {
        callback();
      }
    };
    
    return {
      users: [],
      loading: false,
      currentPage: 1,
      pageSize: 10,
      total: 0,
      dialogVisible: false,
      isEdit: false,
      saveLoading: false,
      currentUserId: null,
      userForm: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        is_admin: false
      },
      userRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请再次输入密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      }
    };
  },
  created() {
    this.fetchUsers();
  },
  methods: {
    // 获取用户列表
    fetchUsers() {
      this.loading = true;
      
      // 模拟API请求
      setTimeout(() => {
        // 这里应该调用实际的API
        this.users = [
          {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            is_admin: true,
            created_at: '2025-01-01 00:00:00'
          },
          {
            id: 2,
            username: 'user1',
            email: 'user1@example.com',
            is_admin: false,
            created_at: '2025-01-02 10:30:00'
          },
          {
            id: 3,
            username: 'user2',
            email: 'user2@example.com',
            is_admin: false,
            created_at: '2025-01-03 14:20:00'
          }
        ];
        
        this.total = this.users.length;
        this.loading = false;
      }, 500);
    },
    
    // 显示添加用户对话框
    showAddUserDialog() {
      this.isEdit = false;
      this.userForm = {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        is_admin: false
      };
      this.dialogVisible = true;
    },
    
    // 编辑用户
    editUser(user) {
      this.isEdit = true;
      this.currentUserId = user.id;
      this.userForm = {
        username: user.username,
        email: user.email,
        is_admin: user.is_admin
      };
      this.dialogVisible = true;
    },
    
    // 保存用户
    saveUser() {
      this.$refs.userForm.validate(valid => {
        if (valid) {
          this.saveLoading = true;
          
          // 模拟API请求
          setTimeout(() => {
            // 这里应该调用实际的API
            if (this.isEdit) {
              // 更新用户
              const index = this.users.findIndex(u => u.id === this.currentUserId);
              if (index !== -1) {
                this.users[index] = {
                  ...this.users[index],
                  username: this.userForm.username,
                  email: this.userForm.email,
                  is_admin: this.userForm.is_admin
                };
              }
              
              this.$message.success('用户更新成功');
            } else {
              // 添加用户
              const newUser = {
                id: this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1,
                username: this.userForm.username,
                email: this.userForm.email,
                is_admin: this.userForm.is_admin,
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
              };
              
              this.users.push(newUser);
              this.total = this.users.length;
              
              this.$message.success('用户添加成功');
            }
            
            this.dialogVisible = false;
            this.saveLoading = false;
          }, 500);
        } else {
          return false;
        }
      });
    },
    
    // 删除用户
    deleteUser(user) {
      this.$confirm(`确定要删除用户 ${user.username} 吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟API请求
        setTimeout(() => {
          // 这里应该调用实际的API
          const index = this.users.findIndex(u => u.id === user.id);
          if (index !== -1) {
            this.users.splice(index, 1);
            this.total = this.users.length;
          }
          
          this.$message.success('用户删除成功');
        }, 500);
      }).catch(() => {
        // 取消删除
      });
    },
    
    // 分页大小变化
    handleSizeChange(val) {
      this.pageSize = val;
      this.fetchUsers();
    },
    
    // 当前页变化
    handleCurrentChange(val) {
      this.currentPage = val;
      this.fetchUsers();
    }
  }
};
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 500;
}

.user-list {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

@media (max-width: 768px) {
  .user-management {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .page-header h2 {
    margin-bottom: 10px;
  }
}
</style>
