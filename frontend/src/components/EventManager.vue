<template>
  <div class="event-manager">
    <h2>事件管理</h2>
    
    <!-- 事件列表 -->
    <div class="event-list">
      <el-table :data="events" style="width: 100%">
        <el-table-column prop="title" label="标题" width="180" />
        <el-table-column prop="start_time" label="开始时间" width="180" />
        <el-table-column prop="end_time" label="结束时间" width="180" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" @click="editEvent(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteEvent(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 添加/编辑事件对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑事件' : '添加事件'">
      <el-form :model="eventForm" label-width="120px">
        <el-form-item label="事件标题" required>
          <el-input v-model="eventForm.title" placeholder="请输入事件标题" />
        </el-form-item>
        <el-form-item label="事件描述">
          <el-input v-model="eventForm.description" type="textarea" placeholder="请输入事件描述" />
        </el-form-item>
        <el-form-item label="是否全天事件">
          <el-switch v-model="eventForm.all_day" />
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-date-picker
            v-model="eventForm.start_time"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="结束时间" v-if="!eventForm.all_day">
          <el-date-picker
            v-model="eventForm.end_time"
            type="datetime"
            placeholder="选择结束时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="通知设置">
          <el-select v-model="eventForm.notification_type" placeholder="选择通知方式">
            <el-option label="WxPusher" value="wxpusher" />
            <el-option label="邮件" value="email" />
            <el-option label="Telegram" value="telegram" />
            <el-option label="不通知" value="none" />
          </el-select>
        </el-form-item>
        <el-form-item label="提前通知时间" v-if="eventForm.notification_type !== 'none'">
          <el-input-number v-model="eventForm.notification_time" :min="5" :max="1440" />
          <span class="ml-2">分钟</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEvent">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加事件按钮 -->
    <div class="add-event">
      <el-button type="primary" @click="showAddEventDialog">添加事件</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EventManager',
  data() {
    return {
      events: [
        {
          id: 1,
          title: '项目会议',
          description: '讨论项目进度',
          start_time: '2025-04-12 14:00:00',
          end_time: '2025-04-12 15:00:00',
          all_day: false
        },
        {
          id: 2,
          title: '团队聚餐',
          description: '庆祝项目完成',
          start_time: '2025-04-12 18:00:00',
          end_time: '2025-04-12 20:00:00',
          all_day: false
        }
      ],
      dialogVisible: false,
      isEdit: false,
      currentEventId: null,
      eventForm: {
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        all_day: false,
        notification_type: 'wxpusher',
        notification_time: 30
      }
    }
  },
  methods: {
    showAddEventDialog() {
      this.isEdit = false;
      this.eventForm = {
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        all_day: false,
        notification_type: 'wxpusher',
        notification_time: 30
      };
      this.dialogVisible = true;
    },
    editEvent(event) {
      this.isEdit = true;
      this.currentEventId = event.id;
      this.eventForm = {
        title: event.title,
        description: event.description,
        start_time: event.start_time,
        end_time: event.end_time,
        all_day: event.all_day,
        notification_type: 'wxpusher', // 假设默认值
        notification_time: 30 // 假设默认值
      };
      this.dialogVisible = true;
    },
    saveEvent() {
      // 表单验证
      if (!this.eventForm.title || !this.eventForm.start_time) {
        this.$message.error('请填写必填字段');
        return;
      }
      
      // 创建事件对象
      const event = {
        title: this.eventForm.title,
        description: this.eventForm.description,
        start_time: this.eventForm.start_time,
        end_time: this.eventForm.all_day ? null : this.eventForm.end_time,
        all_day: this.eventForm.all_day
      };
      
      if (this.isEdit) {
        // 更新现有事件
        const index = this.events.findIndex(e => e.id === this.currentEventId);
        if (index !== -1) {
          event.id = this.currentEventId;
          this.events.splice(index, 1, event);
          this.$message.success('事件更新成功');
        }
      } else {
        // 添加新事件
        event.id = this.events.length > 0 ? Math.max(...this.events.map(e => e.id)) + 1 : 1;
        this.events.push(event);
        this.$message.success('事件添加成功');
      }
      
      this.dialogVisible = false;
    },
    deleteEvent(event) {
      this.$confirm('确定要删除此事件吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.events.findIndex(e => e.id === event.id);
        if (index !== -1) {
          this.events.splice(index, 1);
          this.$message.success('事件删除成功');
        }
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    }
  }
}
</script>

<style scoped>
.event-manager {
  padding: 20px;
}

.event-list {
  margin-bottom: 20px;
}

.add-event {
  margin-top: 20px;
  text-align: right;
}

.ml-2 {
  margin-left: 8px;
}

@media (max-width: 768px) {
  .event-manager {
    padding: 10px;
  }
}
</style>
