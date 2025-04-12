<template>
  <div class="event-management">
    <div class="page-header">
      <h2>事件管理</h2>
      <el-button type="primary" @click="showAddEventDialog">添加事件</el-button>
    </div>
    
    <!-- 事件筛选 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="开始日期">
          <el-date-picker
            v-model="filterForm.startDate"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="filterForm.endDate"
            type="date"
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="用户">
          <el-select v-model="filterForm.userId" placeholder="选择用户" clearable>
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="fetchEvents">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 事件列表 -->
    <el-card class="event-list">
      <el-table :data="events" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" width="180" />
        <el-table-column prop="start_time" label="开始时间" width="180" />
        <el-table-column prop="end_time" label="结束时间" width="180" />
        <el-table-column label="全天事件" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.all_day ? 'success' : 'info'">
              {{ scope.row.all_day ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="user.username" label="创建用户" width="120" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" @click="editEvent(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteEvent(scope.row)">删除</el-button>
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
    
    <!-- 添加/编辑事件对话框 -->
    <el-dialog :title="isEdit ? '编辑事件' : '添加事件'" v-model="dialogVisible" width="500px">
      <el-form :model="eventForm" :rules="eventRules" ref="eventForm" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="eventForm.title" placeholder="请输入事件标题" />
        </el-form-item>
        
        <el-form-item label="描述">
          <el-input v-model="eventForm.description" type="textarea" placeholder="请输入事件描述" />
        </el-form-item>
        
        <el-form-item label="全天事件">
          <el-switch v-model="eventForm.all_day" />
        </el-form-item>
        
        <el-form-item label="开始时间" prop="start_time">
          <el-date-picker
            v-model="eventForm.start_time"
            :type="eventForm.all_day ? 'date' : 'datetime'"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="结束时间" prop="end_time" v-if="!eventForm.all_day">
          <el-date-picker
            v-model="eventForm.end_time"
            type="datetime"
            placeholder="选择结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item label="用户" prop="user_id">
          <el-select v-model="eventForm.user_id" placeholder="选择用户">
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEvent" :loading="saveLoading">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'EventManagement',
  data() {
    return {
      events: [],
      users: [],
      loading: false,
      currentPage: 1,
      pageSize: 10,
      total: 0,
      dialogVisible: false,
      isEdit: false,
      saveLoading: false,
      currentEventId: null,
      filterForm: {
        startDate: '',
        endDate: '',
        userId: ''
      },
      eventForm: {
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        all_day: false,
        user_id: ''
      },
      eventRules: {
        title: [
          { required: true, message: '请输入事件标题', trigger: 'blur' }
        ],
        start_time: [
          { required: true, message: '请选择开始时间', trigger: 'change' }
        ],
        end_time: [
          { required: true, message: '请选择结束时间', trigger: 'change' }
        ],
        user_id: [
          { required: true, message: '请选择用户', trigger: 'change' }
        ]
      }
    };
  },
  created() {
    this.fetchUsers();
    this.fetchEvents();
  },
  methods: {
    // 获取用户列表
    fetchUsers() {
      // 模拟API请求
      setTimeout(() => {
        // 这里应该调用实际的API
        this.users = [
          {
            id: 1,
            username: 'admin'
          },
          {
            id: 2,
            username: 'user1'
          },
          {
            id: 3,
            username: 'user2'
          }
        ];
      }, 500);
    },
    
    // 获取事件列表
    fetchEvents() {
      this.loading = true;
      
      // 模拟API请求
      setTimeout(() => {
        // 这里应该调用实际的API
        this.events = [
          {
            id: 1,
            title: '团队会议',
            description: '讨论项目进度',
            start_time: '2025-04-15 10:00:00',
            end_time: '2025-04-15 11:30:00',
            all_day: false,
            user: {
              id: 1,
              username: 'admin'
            }
          },
          {
            id: 2,
            title: '项目截止日期',
            description: '提交最终版本',
            start_time: '2025-04-20 00:00:00',
            end_time: '2025-04-20 23:59:59',
            all_day: true,
            user: {
              id: 2,
              username: 'user1'
            }
          },
          {
            id: 3,
            title: '客户演示',
            description: '向客户展示项目成果',
            start_time: '2025-04-22 14:00:00',
            end_time: '2025-04-22 15:30:00',
            all_day: false,
            user: {
              id: 1,
              username: 'admin'
            }
          }
        ];
        
        this.total = this.events.length;
        this.loading = false;
      }, 500);
    },
    
    // 重置筛选条件
    resetFilter() {
      this.filterForm = {
        startDate: '',
        endDate: '',
        userId: ''
      };
      this.fetchEvents();
    },
    
    // 显示添加事件对话框
    showAddEventDialog() {
      this.isEdit = false;
      this.eventForm = {
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        all_day: false,
        user_id: ''
      };
      this.dialogVisible = true;
    },
    
    // 编辑事件
    editEvent(event) {
      this.isEdit = true;
      this.currentEventId = event.id;
      this.eventForm = {
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        all_day: event.all_day,
        user_id: event.user.id
      };
      this.dialogVisible = true;
    },
    
    // 保存事件
    saveEvent() {
      this.$refs.eventForm.validate(valid => {
        if (valid) {
          this.saveLoading = true;
          
          // 模拟API请求
          setTimeout(() => {
            // 这里应该调用实际的API
            if (this.isEdit) {
              // 更新事件
              const index = this.events.findIndex(e => e.id === this.currentEventId);
              if (index !== -1) {
                const user = this.users.find(u => u.id === this.eventForm.user_id);
                this.events[index] = {
                  ...this.events[index],
                  title: this.eventForm.title,
                  description: this.eventForm.description,
                  start_time: this.eventForm.start_time,
                  end_time: this.eventForm.end_time,
                  all_day: this.eventForm.all_day,
                  user: user
                };
              }
              
              this.$message.success('事件更新成功');
            } else {
              // 添加事件
              const user = this.users.find(u => u.id === this.eventForm.user_id);
              const newEvent = {
                id: this.events.length > 0 ? Math.max(...this.events.map(e => e.id)) + 1 : 1,
                title: this.eventForm.title,
                description: this.eventForm.description,
                start_time: this.eventForm.start_time,
                end_time: this.eventForm.end_time,
                all_day: this.eventForm.all_day,
                user: user
              };
              
              this.events.push(newEvent);
              this.total = this.events.length;
              
              this.$message.success('事件添加成功');
            }
            
            this.dialogVisible = false;
            this.saveLoading = false;
          }, 500);
        } else {
          return false;
        }
      });
    },
    
    // 删除事件
    deleteEvent(event) {
      this.$confirm(`确定要删除事件 "${event.title}" 吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟API请求
        setTimeout(() => {
          // 这里应该调用实际的API
          const index = this.events.findIndex(e => e.id === event.id);
          if (index !== -1) {
            this.events.splice(index, 1);
            this.total = this.events.length;
          }
          
          this.$message.success('事件删除成功');
        }, 500);
      }).catch(() => {
        // 取消删除
      });
    },
    
    // 分页大小变化
    handleSizeChange(val) {
      this.pageSize = val;
      this.fetchEvents();
    },
    
    // 当前页变化
    handleCurrentChange(val) {
      this.currentPage = val;
      this.fetchEvents();
    }
  }
};
</script>

<style scoped>
.event-management {
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

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
}

.event-list {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

@media (max-width: 768px) {
  .event-management {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .page-header h2 {
    margin-bottom: 10px;
  }
  
  .filter-form {
    flex-direction: column;
  }
  
  .filter-form .el-form-item {
    margin-right: 0;
  }
}
</style>
