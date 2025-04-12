<template>
  <div class="duty-roster-management">
    <div class="page-header">
      <h2>值日表管理</h2>
      <el-button type="primary" @click="showAddDutyDialog">添加值日安排</el-button>
    </div>
    
    <!-- 值日表筛选 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="成员">
          <el-select v-model="filterForm.memberId" placeholder="选择成员" clearable>
            <el-option
              v-for="member in members"
              :key="member.id"
              :label="member.name"
              :value="member.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="fetchDutyRoster">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 值日表视图切换 -->
    <div class="view-toggle">
      <el-radio-group v-model="viewType">
        <el-radio-button label="calendar">日历视图</el-radio-button>
        <el-radio-button label="list">列表视图</el-radio-button>
      </el-radio-group>
    </div>
    
    <!-- 日历视图 -->
    <el-card v-if="viewType === 'calendar'" class="calendar-view">
      <div class="calendar-header">
        <el-button @click="prevMonth"><i class="el-icon-arrow-left"></i></el-button>
        <span class="calendar-title">{{ currentYear }}年{{ currentMonth + 1 }}月</span>
        <el-button @click="nextMonth"><i class="el-icon-arrow-right"></i></el-button>
      </div>
      
      <div class="calendar-grid">
        <!-- 星期标题 -->
        <div class="calendar-weekdays">
          <div class="weekday" v-for="day in weekdays" :key="day">{{ day }}</div>
        </div>
        
        <!-- 日期单元格 -->
        <div class="calendar-days">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            :class="['calendar-day', { 'other-month': day.otherMonth, 'today': day.isToday }]"
          >
            <div class="day-number">{{ day.day }}</div>
            <div class="day-content" v-if="day.duty">
              <div class="duty-member">{{ day.duty.member.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 列表视图 -->
    <el-card v-else class="list-view">
      <el-table :data="dutyRoster" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="date" label="日期" width="150" />
        <el-table-column prop="member.name" label="值日成员" width="150" />
        <el-table-column prop="task" label="任务" />
        <el-table-column label="提醒" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.reminder ? 'success' : 'info'">
              {{ scope.row.reminder ? '已设置' : '未设置' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" @click="editDuty(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteDuty(scope.row)">删除</el-button>
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
    
    <!-- 批量添加值日安排按钮 -->
    <div class="batch-actions">
      <el-button type="primary" @click="showBatchAddDialog">批量添加值日安排</el-button>
    </div>
    
    <!-- 添加/编辑值日安排对话框 -->
    <el-dialog :title="isEdit ? '编辑值日安排' : '添加值日安排'" v-model="dialogVisible" width="500px">
      <el-form :model="dutyForm" :rules="dutyRules" ref="dutyForm" label-width="100px">
        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="dutyForm.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="值日成员" prop="memberId">
          <el-select v-model="dutyForm.memberId" placeholder="选择值日成员">
            <el-option
              v-for="member in members"
              :key="member.id"
              :label="member.name"
              :value="member.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="任务">
          <el-input v-model="dutyForm.task" type="textarea" placeholder="请输入值日任务" />
        </el-form-item>
        
        <el-form-item label="设置提醒">
          <el-switch v-model="dutyForm.reminder" />
        </el-form-item>
        
        <el-form-item label="提醒时间" v-if="dutyForm.reminder">
          <el-time-picker
            v-model="dutyForm.reminderTime"
            format="HH:mm"
            placeholder="选择提醒时间"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveDuty" :loading="saveLoading">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 批量添加值日安排对话框 -->
    <el-dialog title="批量添加值日安排" v-model="batchDialogVisible" width="600px">
      <el-form :model="batchForm" :rules="batchRules" ref="batchForm" label-width="100px">
        <el-form-item label="日期范围" prop="dateRange">
          <el-date-picker
            v-model="batchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="值日成员" prop="memberIds">
          <el-select
            v-model="batchForm.memberIds"
            multiple
            placeholder="选择值日成员"
          >
            <el-option
              v-for="member in members"
              :key="member.id"
              :label="member.name"
              :value="member.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="排序方式">
          <el-radio-group v-model="batchForm.orderType">
            <el-radio label="sequence">按顺序循环</el-radio>
            <el-radio label="weekday">按星期指定</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <template v-if="batchForm.orderType === 'weekday'">
          <el-form-item
            v-for="(day, index) in weekdays"
            :key="index"
            :label="day"
          >
            <el-select
              v-model="batchForm.weekdayMembers[index]"
              placeholder="选择成员"
              clearable
            >
              <el-option
                v-for="member in members"
                :key="member.id"
                :label="member.name"
                :value="member.id"
              />
            </el-select>
          </el-form-item>
        </template>
        
        <el-form-item label="任务">
          <el-input v-model="batchForm.task" type="textarea" placeholder="请输入值日任务" />
        </el-form-item>
        
        <el-form-item label="设置提醒">
          <el-switch v-model="batchForm.reminder" />
        </el-form-item>
        
        <el-form-item label="提醒时间" v-if="batchForm.reminder">
          <el-time-picker
            v-model="batchForm.reminderTime"
            format="HH:mm"
            placeholder="选择提醒时间"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveBatchDuty" :loading="batchSaveLoading">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'DutyRosterManagement',
  data() {
    return {
      // 值日表数据
      dutyRoster: [],
      members: [],
      loading: false,
      currentPage: 1,
      pageSize: 10,
      total: 0,
      
      // 筛选表单
      filterForm: {
        dateRange: [],
        memberId: ''
      },
      
      // 视图类型
      viewType: 'calendar',
      
      // 日历视图数据
      currentDate: new Date(),
      weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      
      // 对话框
      dialogVisible: false,
      isEdit: false,
      saveLoading: false,
      currentDutyId: null,
      dutyForm: {
        date: '',
        memberId: '',
        task: '',
        reminder: false,
        reminderTime: null
      },
      dutyRules: {
        date: [
          { required: true, message: '请选择日期', trigger: 'change' }
        ],
        memberId: [
          { required: true, message: '请选择值日成员', trigger: 'change' }
        ]
      },
      
      // 批量添加对话框
      batchDialogVisible: false,
      batchSaveLoading: false,
      batchForm: {
        dateRange: [],
        memberIds: [],
        orderType: 'sequence',
        weekdayMembers: [null, null, null, null, null, null, null],
        task: '',
        reminder: false,
        reminderTime: null
      },
      batchRules: {
        dateRange: [
          { required: true, message: '请选择日期范围', trigger: 'change' }
        ],
        memberIds: [
          { type: 'array', required: true, message: '请选择值日成员', trigger: 'change' }
        ]
      }
    };
  },
  computed: {
    currentYear() {
      return this.currentDate.getFullYear();
    },
    currentMonth() {
      return this.currentDate.getMonth();
    },
    calendarDays() {
      const year = this.currentYear;
      const month = this.currentMonth;
      
      // 获取当月第一天
      const firstDay = new Date(year, month, 1);
      // 获取当月最后一天
      const lastDay = new Date(year, month + 1, 0);
      
      // 当月天数
      const daysInMonth = lastDay.getDate();
      
      // 当月第一天是星期几
      const firstDayOfWeek = firstDay.getDay();
      
      // 日历格子数组
      const days = [];
      
      // 上个月的日期
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = 0; i < firstDayOfWeek; i++) {
        const day = prevMonthLastDay - firstDayOfWeek + i + 1;
        days.push({
          day,
          otherMonth: true,
          isToday: false,
          duty: null
        });
      }
      
      // 当月的日期
      const today = new Date();
      const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
      const currentDate = today.getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const duty = this.dutyRoster.find(d => d.date === dateStr);
        
        days.push({
          day: i,
          otherMonth: false,
          isToday: isCurrentMonth && i === currentDate,
          duty
        });
      }
      
      // 下个月的日期
      const remainingCells = 42 - days.length; // 6行7列 = 42个格子
      for (let i = 1; i <= remainingCells; i++) {
        days.push({
          day: i,
          otherMonth: true,
          isToday: false,
          duty: null
        });
      }
      
      return days;
    }
  },
  created() {
    this.fetchMembers();
    this.fetchDutyRoster();
  },
  methods: {
    // 获取成员列表
    fetchMembers() {
      // 模拟API请求
      setTimeout(() => {
        // 这里应该调用实际的API
        this.members = [
          {
            id: 1,
            name: '张三'
          },
          {
            id: 2,
            name: '李四'
          },
          {
            id: 3,
            name: '王五'
          },
          {
            id: 4,
            name: '赵六'
          }
        ];
      }, 500);
    },
    
    // 获取值日表
    fetchDutyRoster() {
      this.loading = true;
      
      // 模拟API请求
      setTimeout(() => {
        // 这里应该调用实际的API
        this.dutyRoster = [
          {
            id: 1,
            date: '2025-04-15',
            member: {
              id: 1,
              name: '张三'
            },
            task: '打扫教室',
            reminder: true,
            reminderTime: '08:00'
          },
          {
            id: 2,
            date: '2025-04-16',
            member: {
              id: 2,
              name: '李四'
            },
            task: '整理书架',
            reminder: false,
            reminderTime: null
          },
          {
            id: 3,
            date: '2025-04-17',
            member: {
              id: 3,
              name: '王五'
            },
            task: '擦黑板',
            reminder: true,
            reminderTime: '07:30'
          }
        ];
        
        this.total = this.dutyRoster.length;
        this.loading = false;
      }, 500);
    },
    
    // 重置筛选条件
    resetFilter() {
      this.filterForm = {
        dateRange: [],
        memberId: ''
      };
      this.fetchDutyRoster();
    },
    
    // 上个月
    prevMonth() {
      this.currentDate = new Date(this.currentYear, this.currentMonth - 1, 1);
    },
    
    // 下个月
    nextMonth() {
      this.currentDate = new Date(this.currentYear, this.currentMonth + 1, 1);
    },
    
    // 显示添加值日安排对话框
    showAddDutyDialog() {
      this.isEdit = false;
      this.dutyForm = {
        date: '',
        memberId: '',
        task: '',
        reminder: false,
        reminderTime: null
      };
      this.dialogVisible = true;
    },
    
    // 编辑值日安排
    editDuty(duty) {
      this.isEdit = true;
      this.currentDutyId = duty.id;
      this.dutyForm = {
        date: duty.date,
        memberId: duty.member.id,
        task: duty.task,
        reminder: duty.reminder,
        reminderTime: duty.reminderTime ? new Date(`2025-01-01T${duty.reminderTime}:00`) : null
      };
      this.dialogVisible = true;
    },
    
    // 保存值日安排
    saveDuty() {
      this.$refs.dutyForm.validate(valid => {
        if (valid) {
          this.saveLoading = true;
          
          // 模拟API请求
          setTimeout(() => {
            // 这里应该调用实际的API
            const member = this.members.find(m => m.id === this.dutyForm.memberId);
            
            if (this.isEdit) {
              // 更新值日安排
              const index = this.dutyRoster.findIndex(d => d.id === this.currentDutyId);
              if (index !== -1) {
                this.dutyRoster[index] = {
                  ...this.dutyRoster[index],
                  date: this.dutyForm.date,
                  member: member,
                  task: this.dutyForm.task,
                  reminder: this.dutyForm.reminder,
                  reminderTime: this.dutyForm.reminderTime ? this.formatTime(this.dutyForm.reminderTime) : null
                };
              }
              
              this.$message.success('值日安排更新成功');
            } else {
              // 添加值日安排
              const newDuty = {
                id: this.dutyRoster.length > 0 ? Math.max(...this.dutyRoster.map(d => d.id)) + 1 : 1,
                date: this.dutyForm.date,
                member: member,
                task: this.dutyForm.task,
                reminder: this.dutyForm.reminder,
                reminderTime: this.dutyForm.reminderTime ? this.formatTime(this.dutyForm.reminderTime) : null
              };
              
              this.dutyRoster.push(newDuty);
              this.total = this.dutyRoster.length;
              
              this.$message.success('值日安排添加成功');
            }
            
            this.dialogVisible = false;
            this.saveLoading = false;
          }, 500);
        } else {
          return false;
        }
      });
    },
    
    // 删除值日安排
    deleteDuty(duty) {
      this.$confirm(`确定要删除 ${duty.date} ${duty.member.name} 的值日安排吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟API请求
        setTimeout(() => {
          // 这里应该调用实际的API
          const index = this.dutyRoster.findIndex(d => d.id === duty.id);
          if (index !== -1) {
            this.dutyRoster.splice(index, 1);
            this.total = this.dutyRoster.length;
          }
          
          this.$message.success('值日安排删除成功');
        }, 500);
      }).catch(() => {
        // 取消删除
      });
    },
    
    // 显示批量添加对话框
    showBatchAddDialog() {
      this.batchForm = {
        dateRange: [],
        memberIds: [],
        orderType: 'sequence',
        weekdayMembers: [null, null, null, null, null, null, null],
        task: '',
        reminder: false,
        reminderTime: null
      };
      this.batchDialogVisible = true;
    },
    
    // 保存批量值日安排
    saveBatchDuty() {
      this.$refs.batchForm.validate(valid => {
        if (valid) {
          this.batchSaveLoading = true;
          
          // 模拟API请求
          setTimeout(() => {
            // 这里应该调用实际的API
            this.$message.success('批量值日安排添加成功');
            this.batchDialogVisible = false;
            this.batchSaveLoading = false;
            
            // 刷新值日表
            this.fetchDutyRoster();
          }, 1000);
        } else {
          return false;
        }
      });
    },
    
    // 格式化时间
    formatTime(time) {
      return `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
    },
    
    // 分页大小变化
    handleSizeChange(val) {
      this.pageSize = val;
      this.fetchDutyRoster();
    },
    
    // 当前页变化
    handleCurrentChange(val) {
      this.currentPage = val;
      this.fetchDutyRoster();
    }
  }
};
</script>

<style scoped>
.duty-roster-management {
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

.view-toggle {
  margin-bottom: 20px;
  text-align: center;
}

.calendar-view {
  margin-bottom: 20px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-title {
  font-size: 18px;
  font-weight: 500;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: 500;
  margin-bottom: 10px;
}

.weekday {
  padding: 10px;
  background-color: #f5f7fa;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-gap: 1px;
  background-color: #ebeef5;
}

.calendar-day {
  min-height: 100px;
  padding: 5px;
  background-color: white;
  position: relative;
}

.other-month {
  color: #c0c4cc;
}

.today {
  background-color: #f0f9eb;
}

.day-number {
  font-size: 14px;
  margin-bottom: 5px;
}

.day-content {
  font-size: 12px;
}

.duty-member {
  background-color: #409eff;
  color: white;
  padding: 2px 5px;
  border-radius: 3px;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-view {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.batch-actions {
  margin-top: 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .duty-roster-management {
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
  
  .calendar-day {
    min-height: 60px;
  }
}
</style>
