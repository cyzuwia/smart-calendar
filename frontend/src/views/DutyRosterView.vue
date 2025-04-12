<template>
  <div class="duty-roster-view">
    <h2>值日表</h2>
    <DutyRosterPage />
  </div>
</template>

<script>
import DutyRosterPage from '../components/DutyRosterPage.vue'

export default {
  name: 'DutyRosterView',
  components: {
    DutyRosterPage
  }
}
</script>

<style scoped>
.duty-roster-view h2 {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 500;
}
</style>
