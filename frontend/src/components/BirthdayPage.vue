<template>
  <div class="birthday-page">
    <h2>生日提醒</h2>
    
    <!-- 生日列表 -->
    <div class="birthday-list">
      <el-table :data="birthdays" style="width: 100%">
        <el-table-column prop="name" label="姓名" width="150" />
        <el-table-column label="出生日期" width="180">
          <template #default="scope">
            {{ scope.row.birth_date }} 
            <el-tag size="small" :type="scope.row.calendar_type === 'lunar' ? 'danger' : 'primary'">
              {{ scope.row.calendar_type === 'lunar' ? '农历' : '阳历' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="next_birthday" label="下次生日" width="180" />
        <el-table-column prop="days_remaining" label="倒计时(天)" width="120" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" @click="editBirthday(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteBirthday(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 添加/编辑生日对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑生日信息' : '添加生日信息'">
      <el-form :model="birthdayForm" label-width="120px">
        <el-form-item label="姓名" required>
          <el-input v-model="birthdayForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="日历类型" required>
          <el-radio-group v-model="birthdayForm.calendar_type">
            <el-radio label="solar">阳历</el-radio>
            <el-radio label="lunar">农历</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="出生日期" required>
          <el-date-picker
            v-model="birthdayForm.birth_date"
            type="date"
            placeholder="选择出生日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
          <div class="calendar-type-hint" v-if="birthdayForm.calendar_type === 'lunar'">
            <el-alert
              title="请选择阳历日期，系统会自动转换为对应的农历日期进行计算"
              type="info"
              :closable="false"
              show-icon
            />
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="birthdayForm.note" type="textarea" placeholder="请输入备注信息" />
        </el-form-item>
        <el-form-item label="通知设置">
          <el-select v-model="birthdayForm.notification_type" placeholder="选择通知方式">
            <el-option label="WxPusher" value="wxpusher" />
            <el-option label="邮件" value="email" />
            <el-option label="Telegram" value="telegram" />
            <el-option label="不通知" value="none" />
          </el-select>
        </el-form-item>
        <el-form-item label="提前通知天数" v-if="birthdayForm.notification_type !== 'none'">
          <el-input-number v-model="birthdayForm.notification_days" :min="1" :max="30" />
          <span class="ml-2">天</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveBirthday">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加生日按钮 -->
    <div class="add-birthday">
      <el-button type="primary" @click="showAddBirthdayDialog">添加生日</el-button>
    </div>
    
    <!-- 生日倒计时卡片 -->
    <div class="birthday-countdown" v-if="nextBirthday">
      <el-card class="countdown-card">
        <template #header>
          <div class="card-header">
            <span>即将到来的生日</span>
          </div>
        </template>
        <div class="countdown-content">
          <h3>{{ nextBirthday.name }}的生日</h3>
          <p>
            出生日期: {{ nextBirthday.birth_date }}
            <el-tag size="small" :type="nextBirthday.calendar_type === 'lunar' ? 'danger' : 'primary'">
              {{ nextBirthday.calendar_type === 'lunar' ? '农历' : '阳历' }}
            </el-tag>
          </p>
          <p>下次生日: {{ nextBirthday.next_birthday }}</p>
          <div class="countdown-timer">
            <span class="countdown-value">{{ nextBirthday.days_remaining }}</span>
            <span class="countdown-label">天</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BirthdayPage',
  data() {
    return {
      birthdays: [
        {
          id: 1,
          name: '张三',
          birth_date: '1995-04-15',
          calendar_type: 'solar',
          next_birthday: '2025-04-15',
          days_remaining: 3
        },
        {
          id: 2,
          name: '李四',
          birth_date: '1990-05-20',
          calendar_type: 'solar',
          next_birthday: '2025-05-20',
          days_remaining: 38
        },
        {
          id: 3,
          name: '王五',
          birth_date: '1988-06-10',
          calendar_type: 'lunar',
          next_birthday: '2025-07-03', // 这是转换后的阳历日期
          days_remaining: 82
        }
      ],
      dialogVisible: false,
      isEdit: false,
      currentBirthdayId: null,
      birthdayForm: {
        name: '',
        birth_date: '',
        calendar_type: 'solar', // 默认阳历
        note: '',
        notification_type: 'wxpusher',
        notification_days: 7
      }
    }
  },
  computed: {
    nextBirthday() {
      if (this.birthdays.length === 0) return null;
      
      // 按倒计时天数排序，获取最近的生日
      return [...this.birthdays].sort((a, b) => a.days_remaining - b.days_remaining)[0];
    }
  },
  methods: {
    showAddBirthdayDialog() {
      this.isEdit = false;
      this.birthdayForm = {
        name: '',
        birth_date: '',
        calendar_type: 'solar',
        note: '',
        notification_type: 'wxpusher',
        notification_days: 7
      };
      this.dialogVisible = true;
    },
    editBirthday(birthday) {
      this.isEdit = true;
      this.currentBirthdayId = birthday.id;
      this.birthdayForm = {
        name: birthday.name,
        birth_date: birthday.birth_date,
        calendar_type: birthday.calendar_type || 'solar',
        note: birthday.note || '',
        notification_type: birthday.notification_type || 'wxpusher',
        notification_days: birthday.notification_days || 7
      };
      this.dialogVisible = true;
    },
    saveBirthday() {
      // 表单验证
      if (!this.birthdayForm.name || !this.birthdayForm.birth_date) {
        this.$message.error('请填写必填字段');
        return;
      }
      
      // 创建生日对象
      const birthday = {
        name: this.birthdayForm.name,
        birth_date: this.birthdayForm.birth_date,
        calendar_type: this.birthdayForm.calendar_type,
        note: this.birthdayForm.note,
        notification_type: this.birthdayForm.notification_type,
        notification_days: this.birthdayForm.notification_days
      };
      
      // 这里应该调用API来计算下一个生日日期和倒计时
      // 在实际应用中，这部分应该由后端计算
      // 这里为了演示，使用模拟数据
      const nextBirthdayInfo = this.mockCalculateNextBirthday(
        this.birthdayForm.birth_date, 
        this.birthdayForm.calendar_type
      );
      
      birthday.next_birthday = nextBirthdayInfo.next_birthday;
      birthday.days_remaining = nextBirthdayInfo.days_remaining;
      
      if (this.isEdit) {
        // 更新现有生日信息
        const index = this.birthdays.findIndex(b => b.id === this.currentBirthdayId);
        if (index !== -1) {
          birthday.id = this.currentBirthdayId;
          this.birthdays.splice(index, 1, birthday);
          this.$message.success('生日信息更新成功');
        }
      } else {
        // 添加新生日信息
        birthday.id = this.birthdays.length > 0 ? Math.max(...this.birthdays.map(b => b.id)) + 1 : 1;
        this.birthdays.push(birthday);
        this.$message.success('生日信息添加成功');
      }
      
      this.dialogVisible = false;
    },
    deleteBirthday(birthday) {
      this.$confirm('确定要删除此生日信息吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.birthdays.findIndex(b => b.id === birthday.id);
        if (index !== -1) {
          this.birthdays.splice(index, 1);
          this.$message.success('生日信息删除成功');
        }
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },
    // 模拟计算下一个生日日期和倒计时
    // 在实际应用中，这部分应该由后端计算
    mockCalculateNextBirthday(birthDate, calendarType) {
      const today = new Date();
      const birthDateObj = new Date(birthDate);
      
      if (calendarType === 'solar') {
        // 阳历生日计算
        // 计算今年的生日日期
        const thisYearBirthday = new Date(today.getFullYear(), birthDateObj.getMonth(), birthDateObj.getDate());
        
        // 如果今年的生日已经过了，计算明年的生日
        const nextBirthdayYear = today > thisYearBirthday ? today.getFullYear() + 1 : today.getFullYear();
        const nextBirthday = new Date(nextBirthdayYear, birthDateObj.getMonth(), birthDateObj.getDate());
        
        // 计算剩余天数
        const diffTime = nextBirthday.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          next_birthday: nextBirthday.toISOString().split('T')[0],
          days_remaining: diffDays
        };
      } else {
        // 农历生日计算 (模拟)
        // 在实际应用中，这部分应该使用农历转换库
        // 这里为了演示，使用随机日期
        const randomDays = Math.floor(Math.random() * 365);
        const nextBirthday = new Date();
        nextBirthday.setDate(nextBirthday.getDate() + randomDays);
        
        return {
          next_birthday: nextBirthday.toISOString().split('T')[0],
          days_remaining: randomDays
        };
      }
    }
  }
}
</script>

<style scoped>
.birthday-page {
  padding: 20px;
}

.birthday-list {
  margin-bottom: 20px;
}

.add-birthday {
  margin-top: 20px;
  text-align: right;
}

.birthday-countdown {
  margin-top: 30px;
}

.countdown-card {
  max-width: 400px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.countdown-content {
  text-align: center;
}

.countdown-timer {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.countdown-value {
  font-size: 3rem;
  font-weight: bold;
  color: #3498db;
}

.countdown-label {
  font-size: 1.2rem;
  color: #7f8c8d;
}

.ml-2 {
  margin-left: 8px;
}

.calendar-type-hint {
  margin-top: 8px;
}

@media (max-width: 768px) {
  .birthday-page {
    padding: 10px;
  }
  
  .countdown-value {
    font-size: 2.5rem;
  }
}
</style>
