<template>
  <div class="notification-settings">
    <div class="page-header">
      <h2>通知设置</h2>
    </div>
    
    <!-- 通知渠道设置 -->
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>通知渠道设置</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <!-- WxPusher设置 -->
        <el-tab-pane label="WxPusher" name="wxpusher">
          <el-form :model="wxpusherForm" label-width="120px">
            <el-form-item label="启用WxPusher">
              <el-switch v-model="wxpusherForm.enabled" />
            </el-form-item>
            
            <template v-if="wxpusherForm.enabled">
              <el-form-item label="应用ID (AppToken)">
                <el-input v-model="wxpusherForm.appToken" placeholder="请输入WxPusher应用ID" />
              </el-form-item>
              
              <el-form-item label="用户UID">
                <el-input v-model="wxpusherForm.uid" placeholder="请输入WxPusher用户UID" />
                <div class="form-tip">多个UID请用逗号分隔</div>
              </el-form-item>
              
              <el-form-item label="主题ID">
                <el-input v-model="wxpusherForm.topicId" placeholder="请输入WxPusher主题ID" />
                <div class="form-tip">多个主题ID请用逗号分隔</div>
              </el-form-item>
            </template>
          </el-form>
          
          <div class="form-actions">
            <el-button type="primary" @click="saveWxPusherSettings" :loading="wxpusherSaving">保存设置</el-button>
            <el-button @click="testWxPusher" :disabled="!wxpusherForm.enabled">发送测试消息</el-button>
          </div>
        </el-tab-pane>
        
        <!-- 邮件设置 -->
        <el-tab-pane label="邮件" name="email">
          <el-form :model="emailForm" label-width="120px">
            <el-form-item label="启用邮件通知">
              <el-switch v-model="emailForm.enabled" />
            </el-form-item>
            
            <template v-if="emailForm.enabled">
              <el-form-item label="SMTP服务器">
                <el-input v-model="emailForm.host" placeholder="请输入SMTP服务器地址" />
              </el-form-item>
              
              <el-form-item label="SMTP端口">
                <el-input v-model="emailForm.port" placeholder="请输入SMTP端口" />
              </el-form-item>
              
              <el-form-item label="使用SSL">
                <el-switch v-model="emailForm.secure" />
              </el-form-item>
              
              <el-form-item label="用户名">
                <el-input v-model="emailForm.user" placeholder="请输入SMTP用户名" />
              </el-form-item>
              
              <el-form-item label="密码">
                <el-input v-model="emailForm.pass" type="password" placeholder="请输入SMTP密码" />
              </el-form-item>
              
              <el-form-item label="收件人邮箱">
                <el-input v-model="emailForm.recipient" placeholder="请输入收件人邮箱" />
              </el-form-item>
            </template>
          </el-form>
          
          <div class="form-actions">
            <el-button type="primary" @click="saveEmailSettings" :loading="emailSaving">保存设置</el-button>
            <el-button @click="testEmail" :disabled="!emailForm.enabled">发送测试邮件</el-button>
          </div>
        </el-tab-pane>
        
        <!-- Telegram设置 -->
        <el-tab-pane label="Telegram" name="telegram">
          <el-form :model="telegramForm" label-width="120px">
            <el-form-item label="启用Telegram">
              <el-switch v-model="telegramForm.enabled" />
            </el-form-item>
            
            <template v-if="telegramForm.enabled">
              <el-form-item label="Bot Token">
                <el-input v-model="telegramForm.botToken" placeholder="请输入Telegram Bot Token" />
              </el-form-item>
              
              <el-form-item label="Chat ID">
                <el-input v-model="telegramForm.chatId" placeholder="请输入Telegram Chat ID" />
              </el-form-item>
            </template>
          </el-form>
          
          <div class="form-actions">
            <el-button type="primary" @click="saveTelegramSettings" :loading="telegramSaving">保存设置</el-button>
            <el-button @click="testTelegram" :disabled="!telegramForm.enabled">发送测试消息</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 通知分组设置 -->
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>通知分组设置</span>
          <el-button type="text" @click="showAddGroupDialog">添加分组</el-button>
        </div>
      </template>
      
      <el-table :data="notificationGroups" style="width: 100%">
        <el-table-column prop="name" label="分组名称" width="180" />
        <el-table-column label="事件类型" width="250">
          <template #default="scope">
            <el-tag v-for="type in scope.row.eventTypes" :key="type" class="event-type-tag">
              {{ getEventTypeName(type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-switch v-model="scope.row.enabled" @change="updateGroupStatus(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" @click="editGroup(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteGroup(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 通知时间设置 -->
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>通知时间设置</span>
        </div>
      </template>
      
      <el-form :model="timeSettingsForm" label-width="120px">
        <el-form-item label="事件提醒">
          <div class="time-range-picker">
            <el-time-picker
              v-model="timeSettingsForm.event.startTime"
              format="HH:mm"
              placeholder="开始时间"
            />
            <span class="time-separator">至</span>
            <el-time-picker
              v-model="timeSettingsForm.event.endTime"
              format="HH:mm"
              placeholder="结束时间"
            />
          </div>
        </el-form-item>
        
        <el-form-item label="生日提醒">
          <div class="time-range-picker">
            <el-time-picker
              v-model="timeSettingsForm.birthday.startTime"
              format="HH:mm"
              placeholder="开始时间"
            />
            <span class="time-separator">至</span>
            <el-time-picker
              v-model="timeSettingsForm.birthday.endTime"
              format="HH:mm"
              placeholder="结束时间"
            />
          </div>
        </el-form-item>
        
        <el-form-item label="值日提醒">
          <div class="time-range-picker">
            <el-time-picker
              v-model="timeSettingsForm.duty.startTime"
              format="HH:mm"
              placeholder="开始时间"
            />
            <span class="time-separator">至</span>
            <el-time-picker
              v-model="timeSettingsForm.duty.endTime"
              format="HH:mm"
              placeholder="结束时间"
            />
          </div>
        </el-form-item>
      </el-form>
      
      <div class="form-actions">
        <el-button type="primary" @click="saveTimeSettings" :loading="timeSaving">保存设置</el-button>
      </div>
    </el-card>
    
    <!-- 添加/编辑通知分组对话框 -->
    <el-dialog :title="isEditGroup ? '编辑通知分组' : '添加通知分组'" v-model="groupDialogVisible" width="500px">
      <el-form :model="groupForm" :rules="groupRules" ref="groupForm" label-width="100px">
        <el-form-item label="分组名称" prop="name">
          <el-input v-model="groupForm.name" placeholder="请输入分组名称" />
        </el-form-item>
        
        <el-form-item label="事件类型" prop="eventTypes">
          <el-checkbox-group v-model="groupForm.eventTypes">
            <el-checkbox label="event">事件提醒</el-checkbox>
            <el-checkbox label="birthday">生日提醒</el-checkbox>
            <el-checkbox label="duty">值日提醒</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="启用状态">
          <el-switch v-model="groupForm.enabled" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="groupDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveGroup" :loading="groupSaving">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'NotificationSettings',
  data() {
    return {
      activeTab: 'wxpusher',
      
      // WxPusher设置
      wxpusherForm: {
        enabled: true,
        appToken: 'AT_xxxxxxxxxxxxxxxxxxxxxxxx',
        uid: 'UID_xxxxxxxxxxxxxxxx',
        topicId: ''
      },
      wxpusherSaving: false,
      
      // 邮件设置
      emailForm: {
        enabled: false,
        host: 'smtp.example.com',
        port: '465',
        secure: true,
        user: 'user@example.com',
        pass: '',
        recipient: 'recipient@example.com'
      },
      emailSaving: false,
      
      // Telegram设置
      telegramForm: {
        enabled: false,
        botToken: '',
        chatId: ''
      },
      telegramSaving: false,
      
      // 通知分组
      notificationGroups: [
        {
          id: 1,
          name: '重要提醒',
          eventTypes: ['event', 'birthday'],
          enabled: true
        },
        {
          id: 2,
          name: '日常提醒',
          eventTypes: ['duty'],
          enabled: true
        }
      ],
      
      // 通知时间设置
      timeSettingsForm: {
        event: {
          startTime: new Date(2025, 0, 1, 8, 0),
          endTime: new Date(2025, 0, 1, 22, 0)
        },
        birthday: {
          startTime: new Date(2025, 0, 1, 9, 0),
          endTime: new Date(2025, 0, 1, 21, 0)
        },
        duty: {
          startTime: new Date(2025, 0, 1, 7, 0),
          endTime: new Date(2025, 0, 1, 20, 0)
        }
      },
      timeSaving: false,
      
      // 分组对话框
      groupDialogVisible: false,
      isEditGroup: false,
      currentGroupId: null,
      groupForm: {
        name: '',
        eventTypes: [],
        enabled: true
      },
      groupRules: {
        name: [
          { required: true, message: '请输入分组名称', trigger: 'blur' }
        ],
        eventTypes: [
          { type: 'array', required: true, message: '请至少选择一种事件类型', trigger: 'change' }
        ]
      },
      groupSaving: false
    };
  },
  methods: {
    // 保存WxPusher设置
    saveWxPusherSettings() {
      this.wxpusherSaving = true;
      
      // 模拟API请求
      setTimeout(() => {
        this.$message.success('WxPusher设置保存成功');
        this.wxpusherSaving = false;
      }, 500);
    },
    
    // 测试WxPusher
    testWxPusher() {
      this.$message.info('正在发送WxPusher测试消息...');
      
      // 模拟API请求
      setTimeout(() => {
        this.$message.success('WxPusher测试消息发送成功');
      }, 1000);
    },
    
    // 保存邮件设置
    saveEmailSettings() {
      this.emailSaving = true;
      
      // 模拟API请求
      setTimeout(() => {
        this.$message.success('邮件设置保存成功');
        this.emailSaving = false;
      }, 500);
    },
    
    // 测试邮件
    testEmail() {
      this.$message.info('正在发送测试邮件...');
      
      // 模拟API请求
      setTimeout(() => {
        this.$message.success('测试邮件发送成功');
      }, 1000);
    },
    
    // 保存Telegram设置
    saveTelegramSettings() {
      this.telegramSaving = true;
      
      // 模拟API请求
      setTimeout(() => {
        this.$message.success('Telegram设置保存成功');
        this.telegramSaving = false;
      }, 500);
    },
    
    // 测试Telegram
    testTelegram() {
      this.$message.info('正在发送Telegram测试消息...');
      
      // 模拟API请求
      setTimeout(() => {
        this.$message.success('Telegram测试消息发送成功');
      }, 1000);
    },
    
    // 获取事件类型名称
    getEventTypeName(type) {
      const typeMap = {
        event: '事件提醒',
        birthday: '生日提醒',
        duty: '值日提醒'
      };
      
      return typeMap[type] || type;
    },
    
    // 更新分组状态
    updateGroupStatus(group) {
      // 模拟API请求
      setTimeout(() => {
        this.$message.success(`${group.name}分组${group.enabled ? '启用' : '禁用'}成功`);
      }, 500);
    },
    
    // 显示添加分组对话框
    showAddGroupDialog() {
      this.isEditGroup = false;
      this.groupForm = {
        name: '',
        eventTypes: [],
        enabled: true
      };
      this.groupDialogVisible = true;
    },
    
    // 编辑分组
    editGroup(group) {
      this.isEditGroup = true;
      this.currentGroupId = group.id;
      this.groupForm = {
        name: group.name,
        eventTypes: [...group.eventTypes],
        enabled: group.enabled
      };
      this.groupDialogVisible = true;
    },
    
    // 保存分组
    saveGroup() {
      this.$refs.groupForm.validate(valid => {
        if (valid) {
          this.groupSaving = true;
          
          // 模拟API请求
          setTimeout(() => {
            if (this.isEditGroup) {
              // 更新分组
              const index = this.notificationGroups.findIndex(g => g.id === this.currentGroupId);
              if (index !== -1) {
                this.notificationGroups[index] = {
                  ...this.notificationGroups[index],
                  name: this.groupForm.name,
                  eventTypes: [...this.groupForm.eventTypes],
                  enabled: this.groupForm.enabled
                };
              }
              
              this.$message.success('通知分组更新成功');
            } else {
              // 添加分组
              const newGroup = {
                id: this.notificationGroups.length > 0 ? Math.max(...this.notificationGroups.map(g => g.id)) + 1 : 1,
                name: this.groupForm.name,
                eventTypes: [...this.groupForm.eventTypes],
                enabled: this.groupForm.enabled
              };
              
              this.notificationGroups.push(newGroup);
              
              this.$message.success('通知分组添加成功');
            }
            
            this.groupDialogVisible = false;
            this.groupSaving = false;
          }, 500);
        } else {
          return false;
        }
      });
    },
    
    // 删除分组
    deleteGroup(group) {
      this.$confirm(`确定要删除通知分组 "${group.name}" 吗?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟API请求
        setTimeout(() => {
          const index = this.notificationGroups.findIndex(g => g.id === group.id);
          if (index !== -1) {
            this.notificationGroups.splice(index, 1);
          }
          
          this.$message.success('通知分组删除成功');
        }, 500);
      }).catch(() => {
        // 取消删除
      });
    },
    
    // 保存时间设置
    saveTimeSettings() {
      this.timeSaving = true;
      
      // 模拟API请求
      setTimeout(() => {
        this.$message.success('通知时间设置保存成功');
        this.timeSaving = false;
      }, 500);
    }
  }
};
</script>

<style scoped>
.notification-settings {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 500;
}

.settings-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.form-actions {
  margin-top: 20px;
  text-align: right;
}

.time-range-picker {
  display: flex;
  align-items: center;
}

.time-separator {
  margin: 0 10px;
}

.event-type-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}

@media (max-width: 768px) {
  .notification-settings {
    padding: 10px;
  }
  
  .time-range-picker {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .time-separator {
    margin: 10px 0;
  }
}
</style>
