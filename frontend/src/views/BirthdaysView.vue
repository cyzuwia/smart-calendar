<template>
  <div class="birthdays-view">
    <h2>生日提醒</h2>
    <BirthdayPage />
  </div>
</template>

<script>
import BirthdayPage from '../components/BirthdayPage.vue'

export default {
  name: 'BirthdaysView',
  components: {
    BirthdayPage
  }
}
</script>

<style scoped>
.birthdays-view h2 {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 500;
}
</style>
