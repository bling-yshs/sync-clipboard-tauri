<template>
  <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
    <div class="flex justify-around items-center h-16">
      <!-- 主页按钮 -->
      <button
        @click="navigateTo('/home')"
        :class="[
          'flex flex-col items-center justify-center flex-1 h-full transition-colors',
          isActive('/home') ? 'text-blue-600' : 'text-gray-500'
        ]"
      >
        <div class="text-xl mb-1">🏠</div>
        <span class="text-xs">主页</span>
      </button>

      <!-- 设置按钮 -->
      <button
        @click="navigateTo('/settings')"
        :class="[
          'flex flex-col items-center justify-center flex-1 h-full transition-colors',
          isActive('/settings') ? 'text-blue-600' : 'text-gray-500'
        ]"
      >
        <div class="text-xl mb-1">⚙️</div>
        <span class="text-xs">设置</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

function navigateTo(path: string) {
  router.push(path)
}

function isActive(path: string): boolean {
  return route.path === path
}
</script>

<style scoped>
button:active {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>
