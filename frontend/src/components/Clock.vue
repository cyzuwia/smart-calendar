<template>
  <div class="clock-container">
    <div class="time">{{ time }}</div>
    <div class="date">{{ date }}</div>
    <div class="day">{{ day }}</div>
  </div>
</template>

<script>
export default {
  name: 'Clock',
  data() {
    return {
      time: '',
      date: '',
      day: '',
      timer: null
    }
  },
  mounted() {
    this.updateTime();
    this.timer = setInterval(this.updateTime, 1000);
  },
  beforeUnmount() {
    clearInterval(this.timer);
  },
  methods: {
    updateTime() {
      const now = new Date();
      
      // 格式化时间 HH:MM:SS
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      this.time = `${hours}:${minutes}:${seconds}`;
      
      // 格式化日期 YYYY年MM月DD日
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      this.date = `${year}年${month}月${date}日`;
      
      // 获取星期
      const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      this.day = days[now.getDay()];
    }
  }
}
</script>

<style scoped>
.clock-container {
  text-align: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.time {
  font-size: 3rem;
  font-weight: 500;
  color: #333333;
  margin-bottom: 5px;
}

.date {
  font-size: 1.5rem;
  color: #333333;
  margin-bottom: 5px;
}

.day {
  font-size: 1.2rem;
  color: #7f8c8d;
}

@media (max-width: 768px) {
  .time {
    font-size: 2.5rem;
  }
  
  .date {
    font-size: 1.2rem;
  }
  
  .day {
    font-size: 1rem;
  }
}
</style>
