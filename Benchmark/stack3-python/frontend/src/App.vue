<template>
  <div id="app">
    <header class="app-header">
      <h1>EpiTrello - Stack 3 PoC</h1>
      <p class="subtitle">Vue.js + Django + PostgreSQL</p>
    </header>
    <router-view />
  </div>
</template>

<script setup>
// Main App Component
</script>

<style scoped>
.app-header {
  background: linear-gradient(135deg, #00fff2ff 0%, #0059ffff 100%);
  color: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 2.5rem;
}

.subtitle {
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
  font-size: 1.1rem;
}
</style>
