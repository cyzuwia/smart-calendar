<template>
  <div class="events-view">
    <h2>事件管理</h2>
    <EventManager />
  </div>
</template>

<script>
import EventManager from '../components/EventManager.vue'

export default {
  name: 'EventsView',
  components: {
    EventManager
  }
}
</script>

<style scoped>
.events-view h2 {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 500;
}
</style>
