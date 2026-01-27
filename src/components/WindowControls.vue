<script setup lang="ts">
const minimize = () => {
  window.api.window.minimize()
}

const maximize = () => {
  window.api.window.maximize()
}

const close = () => {
  window.api.window.close()
}
</script>

<template>
  <div class="traffic-lights no-drag">
    <div class="traffic-light close" @click="close" title="关闭">
      <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0.8 0.8L5.2 5.2M5.2 0.8L0.8 5.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="traffic-light minimize" @click="minimize" title="最小化">
      <svg width="6" height="2" viewBox="0 0 8 2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 1H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="traffic-light maximize" @click="maximize" title="最大化">
      <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0.5 3L3 0.5L5.5 3M0.5 3L3 5.5L5.5 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.traffic-lights {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
}

.traffic-light {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.traffic-light svg {
  opacity: 0;
  color: rgba(0, 0, 0, 0.6);
  transition: opacity 0.2s ease;
}

.traffic-lights:hover .traffic-light svg {
  opacity: 1;
}

.close {
  background-color: #ff5f57;
  border: 1px solid #e0443e;
}
.close:active {
  background-color: #bf4942;
}

.minimize {
  background-color: #febc2e;
  border: 1px solid #dba522;
}
.minimize:active {
  background-color: #bf8e22;
}

.maximize {
  background-color: #28c840;
  border: 1px solid #1aab29;
}
.maximize:active {
  background-color: #1f9a31;
}
</style>
