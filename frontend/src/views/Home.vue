<template>
  <div class="home-page">
    <div class="clock-container">
      <Clock />
    </div>
    
    <div class="dashboard-container">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8">
          <el-card class="dashboard-card">
            <template #header>
              <div class="card-header">
                <h3>今日事件</h3>
                <el-button type="text" @click="$router.push('/events')">查看全部</el-button>
              </div>
            </template>
            <div v-if="todayEvents.length > 0">
              <div v-for="event in todayEvents" :key="event.id" class="event-item">
                <div class="event-time">{{ formatTime(event.start_time) }}</div>
                <div class="event-title">{{ event.title }}</div>
              </div>
            </div>
            <div v-else class="empty-placeholder">
              <el-empty description="今日暂无事件" />
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="8">
          <el-card class="dashboard-card">
            <template #header>
              <div class="card-header">
                <h3>即将到来的生日</h3>
                <el-button type="text" @click="$router.push('/birthdays')">查看全部</el-button>
              </div>
            </template>
            <div v-if="upcomingBirthdays.length > 0">
              <div v-for="birthday in upcomingBirthdays" :key="birthday.id" class="birthday-item">
                <div class="birthday-days">{{ birthday.days_remaining }}天后</div>
                <div class="birthday-info">
                  <span class="birthday-name">{{ birthday.name }}</span>
                  <el-tag size="small" :type="birthday.calendar_type === 'solar' ? 'primary' : 'success'">
                    {{ birthday.calendar_type === 'solar' ? '阳历' : '农历' }}
                  </el-tag>
                </div>
                <div class="birthday-date">{{ birthday.next_birthday }}</div>
              </div>
            </div>
            <div v-else class="empty-placeholder">
              <el-empty description="暂无即将到来的生日" />
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="8">
          <el-card class="dashboard-card">
            <template #header>
              <div class="card-header">
                <h3>今日值日</h3>
                <el-button type="text" @click="$router.push('/duty-roster')">查看全部</el-button>
              </div>
            </template>
            <div v-if="todayDuty.length > 0">
              <div v-for="duty in todayDuty" :key="duty.id" class="duty-item">
                <div class="duty-member">{{ duty.member.name }}</div>
                <div class="duty-task">{{ duty.task }}</div>
              </div>
            </div>
            <div v-else class="empty-placeholder">
              <el-empty description="今日暂无值日安排" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import Clock from '../components/Clock.vue'
import axios from 'axios'

export default {
  name: 'Home',
  components: {
    Clock
  },
  data() {
    return {
      todayEvents: [],
      upcomingBirthdays: [],
      todayDuty: []
    }
  },
  created() {
    this.fetchTodayEvents()
    this.fetchUpcomingBirthdays()
    this.fetchTodayDuty()
  },
  methods: {
    formatTime(timeString) {
      const date = new Date(timeString)
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    },
    fetchTodayEvents() {
      // 模拟API请求
      setTimeout(() => {
        // 这里应该调用实际的API
        this.todayEvents = [
          {
            id: 1,
            title: '团队会议',
            start_time: '2025-04-12T10:00:00',
            end_time: '2025-04-12T11:30:00'
          },
          {
            id: 2,
            title: '项目演示',
            start_time: '2025-04-12T14:30:00',
            end_time: '2025-04-12T16:00:00'
          }
        ]
      }, 500)
    },
    fetchUpcomingBirthdays() {
      // 模拟API请求
      setTimeout(() => {
        // 这里应该调用实际的API
        this.upcomingBirthdays = [
          {
            id: 1,
            name: '张三',
            birth_date: '1990-05-15',
            calendar_type: 'solar',
            next_birthday: '2025-05-15',
            days_remaining: 33
          },
          {
            id: 2,
            name: '李四',
            birth_date: '1992-01-15',
            calendar_type: 'lunar',
            next_birthday: '2025-04-20',
            days_remaining: 8
          }
        ]
      }, 500)
    },
    fetchTodayDuty() {
      // 模拟API请求
      setTimeout(() => {
        // 这里应该调用实际的API
        this.todayDuty = [
          {
            id: 1,
            date: '2025-04-12',
            member: {
              id: 1,
              name: '王五'
            },
            task: '打扫教室'
          }
        ]
      }, 500)
    }
  }
}
</script>

<style scoped>
.home-page {
  padding: 20px 0;
}

.clock-container {
  margin-bottom: 30px;
  text-align: center;
}

.dashboard-container {
  margin-top: 20px;
}

.dashboard-card {
  margin-bottom: 20px;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.event-item, .birthday-item, .duty-item {
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.event-item:last-child, .birthday-item:last-child, .duty-item:last-child {
  border-bottom: none;
}

.event-time {
  font-size: 14px;
  color: #409eff;
  margin-bottom: 5px;
}

.event-title {
  font-size: 16px;
  font-weight: 500;
}

.birthday-days {
  font-size: 14px;
  color: #67c23a;
  margin-bottom: 5px;
}

.birthday-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.birthday-name {
  font-size: 16px;
  font-weight: 500;
}

.birthday-date {
  font-size: 14px;
  color: #909399;
}

.duty-member {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
}

.duty-task {
  font-size: 14px;
  color: #606266;
}

.empty-placeholder {
  padding: 20px 0;
}

@media (max-width: 768px) {
  .home-page {
    padding: 10px 0;
  }
  
  .clock-container {
    margin-bottom: 20px;
  }
}
</style>
