<template>
  <div class="duty-roster-page">
    <h2>值日表管理</h2>
    
    <!-- 值日表日历视图 -->
    <div class="duty-calendar">
      <div class="calendar-header">
        <el-button @click="prevMonth" icon="el-icon-arrow-left">上个月</el-button>
        <span class="month-title">{{ currentYear }}年{{ currentMonth + 1 }}月</span>
        <el-button @click="nextMonth" icon="el-icon-arrow-right">下个月</el-button>
      </div>
      
      <div class="calendar-grid">
        <div class="weekday-header" v-for="day in weekdays" :key="day">{{ day }}</div>
        <div 
          v-for="day in calendarDays" 
          :key="day.date" 
          class="calendar-day" 
          :class="{ 'current-month': day.currentMonth, 'today': day.isToday }"
        >
          <div class="day-number">{{ day.dayNumber }}</div>
          <div class="duty-person" v-if="day.dutyPerson">
            <el-tag size="small">{{ day.dutyPerson }}</el-tag>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 值日表列表视图 -->
    <div class="duty-list">
      <h3>值日安排列表</h3>
      <el-table :data="dutyRoster" style="width: 100%">
        <el-table-column prop="name" label="值日人" width="180" />
        <el-table-column prop="duty_date" label="值日日期" width="180" />
        <el-table-column label="操作" v-if="isAdmin">
          <template #default="scope">
            <el-button size="small" @click="editDuty(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteDuty(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 添加/编辑值日安排对话框 (仅管理员) -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑值日安排' : '添加值日安排'" v-if="isAdmin">
      <el-form :model="dutyForm" label-width="120px">
        <el-form-item label="值日人" required>
          <el-input v-model="dutyForm.name" placeholder="请输入值日人姓名" />
        </el-form-item>
        <el-form-item label="值日日期" required>
          <el-date-picker
            v-model="dutyForm.duty_date"
            type="date"
            placeholder="选择值日日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveDuty">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 批量添加值日安排对话框 (仅管理员) -->
    <el-dialog v-model="batchDialogVisible" title="批量添加值日安排" v-if="isAdmin">
      <el-form :model="batchForm" label-width="120px">
        <el-form-item label="值日人列表" required>
          <el-input
            type="textarea"
            v-model="batchForm.names"
            placeholder="请输入值日人姓名，每行一个"
            :rows="5"
          />
        </el-form-item>
        <el-form-item label="开始日期" required>
          <el-date-picker
            v-model="batchForm.start_date"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="间隔天数">
          <el-input-number v-model="batchForm.interval" :min="1" :max="30" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveBatchDuty">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 管理按钮 (仅管理员) -->
    <div class="duty-actions" v-if="isAdmin">
      <el-button type="primary" @click="showAddDutyDialog">添加值日安排</el-button>
      <el-button type="success" @click="showBatchAddDialog">批量添加值日安排</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DutyRosterPage',
  data() {
    return {
      isAdmin: true, // 假设当前用户是管理员
      weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth(),
      dutyRoster: [
        {
          id: 1,
          name: '张三',
          duty_date: '2025-04-08'
        },
        {
          id: 2,
          name: '李四',
          duty_date: '2025-04-09'
        },
        {
          id: 3,
          name: '王五',
          duty_date: '2025-04-10'
        },
        {
          id: 4,
          name: '赵六',
          duty_date: '2025-04-11'
        },
        {
          id: 5,
          name: '钱七',
          duty_date: '2025-04-12'
        }
      ],
      dialogVisible: false,
      batchDialogVisible: false,
      isEdit: false,
      currentDutyId: null,
      dutyForm: {
        name: '',
        duty_date: ''
      },
      batchForm: {
        names: '',
        start_date: '',
        interval: 1
      }
    }
  },
  computed: {
    calendarDays() {
      const days = [];
      const year = this.currentYear;
      const month = this.currentMonth;
      
      // 获取当月第一天是星期几
      const firstDay = new Date(year, month, 1).getDay();
      
      // 获取当月天数
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      // 获取上个月天数
      const daysInPrevMonth = new Date(year, month, 0).getDate();
      
      // 获取今天日期
      const today = new Date();
      const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
      const currentDate = today.getDate();
      
      // 添加上个月的日期
      for (let i = firstDay - 1; i >= 0; i--) {
        const dayNumber = daysInPrevMonth - i;
        days.push({
          date: `${year}-${month === 0 ? 12 : month}-${dayNumber}`,
          dayNumber,
          currentMonth: false,
          isToday: false,
          dutyPerson: this.getDutyPerson(new Date(year, month - 1, dayNumber))
        });
      }
      
      // 添加当月的日期
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({
          date: `${year}-${month + 1}-${i}`,
          dayNumber: i,
          currentMonth: true,
          isToday: isCurrentMonth && i === currentDate,
          dutyPerson: this.getDutyPerson(new Date(year, month, i))
        });
      }
      
      // 添加下个月的日期，补满6行
      const remainingDays = 42 - days.length;
      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          date: `${year}-${month + 2}-${i}`,
          dayNumber: i,
          currentMonth: false,
          isToday: false,
          dutyPerson: this.getDutyPerson(new Date(year, month + 1, i))
        });
      }
      
      return days;
    }
  },
  methods: {
    prevMonth() {
      if (this.currentMonth === 0) {
        this.currentYear--;
        this.currentMonth = 11;
      } else {
        this.currentMonth--;
      }
    },
    nextMonth() {
      if (this.currentMonth === 11) {
        this.currentYear++;
        this.currentMonth = 0;
      } else {
        this.currentMonth++;
      }
    },
    getDutyPerson(date) {
      // 格式化日期为 YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      
      // 查找该日期的值日人
      const dutyInfo = this.dutyRoster.find(duty => duty.duty_date === formattedDate);
      return dutyInfo ? dutyInfo.name : null;
    },
    showAddDutyDialog() {
      this.isEdit = false;
      this.dutyForm = {
        name: '',
        duty_date: ''
      };
      this.dialogVisible = true;
    },
    editDuty(duty) {
      this.isEdit = true;
      this.currentDutyId = duty.id;
      this.dutyForm = {
        name: duty.name,
        duty_date: duty.duty_date
      };
      this.dialogVisible = true;
    },
    saveDuty() {
      // 表单验证
      if (!this.dutyForm.name || !this.dutyForm.duty_date) {
        this.$message.error('请填写必填字段');
        return;
      }
      
      // 创建值日安排对象
      const duty = {
        name: this.dutyForm.name,
        duty_date: this.dutyForm.duty_date
      };
      
      if (this.isEdit) {
        // 更新现有值日安排
        const index = this.dutyRoster.findIndex(d => d.id === this.currentDutyId);
        if (index !== -1) {
          duty.id = this.currentDutyId;
          this.dutyRoster.splice(index, 1, duty);
          this.$message.success('值日安排更新成功');
        }
      } else {
        // 添加新值日安排
        duty.id = this.dutyRoster.length > 0 ? Math.max(...this.dutyRoster.map(d => d.id)) + 1 : 1;
        this.dutyRoster.push(duty);
        this.$message.success('值日安排添加成功');
      }
      
      this.dialogVisible = false;
    },
    deleteDuty(duty) {
      this.$confirm('确定要删除此值日安排吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.dutyRoster.findIndex(d => d.id === duty.id);
        if (index !== -1) {
          this.dutyRoster.splice(index, 1);
          this.$message.success('值日安排删除成功');
        }
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    showBatchAddDialog() {
      this.batchForm = {
        names: '',
        start_date: '',
        interval: 1
      };
      this.batchDialogVisible = true;
    },
    saveBatchDuty() {
      // 表单验证
      if (!this.batchForm.names || !this.batchForm.start_date) {
        this.$message.error('请填写必填字段');
        return;
      }
      
      // 解析值日人列表
      const names = this.batchForm.names.split('\n').filter(name => name.trim() !== '');
      if (names.length === 0) {
        this.$message.error('请输入至少一个值日人');
        return;
      }
      
      // 创建值日安排
      const startDate = new Date(this.batchForm.start_date);
      const interval = this.batchForm.interval;
      let nextId = this.dutyRoster.length > 0 ? Math.max(...this.dutyRoster.map(d => d.id)) + 1 : 1;
      
      const newDuties = [];
      for (let i = 0; i < names.length; i++) {
        const dutyDate = new Date(startDate);
        dutyDate.setDate(dutyDate.getDate() + i * interval);
        
        newDuties.push({
          id: nextId++,
          name: names[i],
          duty_date: dutyDate.toISOString().split('T')[0]
        });
      }
      
      // 添加到值日表
      this.dutyRoster = [...this.dutyRoster, ...newDuties];
      this.$message.success(`成功添加${newDuties.length}条值日安排`);
      
      this.batchDialogVisible = false;
    }
  }
}
</script>

<style scoped>
.duty-roster-page {
  padding: 20px;
}

.duty-calendar {
  margin-bottom: 30px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.month-title {
  font-size: 1.5rem;
  font-weight: 500;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.weekday-header {
  text-align: center;
  font-weight: 500;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.calendar-day {
  min-height: 80px;
  padding: 5px;
  border: 1px solid #dfe4ea;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.calendar-day.current-month {
  background-color: #ffffff;
}

.calendar-day.today {
  background-color: #e8f4fc;
  border-color: #3498db;
}

.day-number {
  font-weight: 500;
  margin-bottom: 5px;
}

.duty-person {
  margin-top: 5px;
}

.duty-list {
  margin-bottom: 30px;
}

.duty-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .duty-roster-page {
    padding: 10px;
  }
  
  .calendar-grid {
    gap: 2px;
  }
  
  .calendar-day {
    min-height: 60px;
    padding: 3px;
  }
  
  .duty-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
