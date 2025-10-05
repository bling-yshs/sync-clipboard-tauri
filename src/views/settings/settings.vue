<template>
  <div class="container mx-auto p-6 pb-20">
    <h1 class="text-2xl font-bold mb-6">设置</h1>
    
    <div class="space-y-6">
      <!-- 延迟退出时间设置 -->
      <div class="bg-white rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-4">延迟退出时间</h2>
        <p class="text-gray-600 text-sm mb-4">
          设置上传或下载操作完成后，延迟多少秒退出程序
        </p>
        
        <div class="space-y-3">
          <div class="flex items-center space-x-4">
            <label class="text-sm font-medium min-w-20">延迟时间：</label>
            <div class="flex items-center space-x-2 flex-1">
              <input
                v-model.number="exitDelay"
                @input="saveExitDelay"
                @blur="validateExitDelay"
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                class="border border-gray-300 rounded px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span class="text-sm text-gray-600">秒</span>
            </div>
          </div>
          <div class="text-xs text-gray-500 ml-24">
            输入 0 表示立即退出，支持小数（如 1.5）
          </div>
        </div>
      </div>

      <!-- 调试选项 -->
      <div class="bg-white rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-4">开发者选项</h2>
        <p class="text-gray-600 text-sm mb-4">
          调试和测试功能
        </p>
        
        <button
          @click="goToDebug"
          class="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
        >
          🔧 调试页面
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const exitDelay = ref<number>(0)

// 保存延迟退出时间到本地存储
function saveExitDelay() {
  localStorage.setItem('exitDelay', exitDelay.value.toString())
  console.log(`延迟退出时间已保存: ${exitDelay.value}秒`)
}

// 从本地存储加载延迟退出时间
function loadExitDelay() {
  const saved = localStorage.getItem('exitDelay')
  if (saved) {
    exitDelay.value = Number.parseFloat(saved)
  }
}

// 验证并修正延迟时间输入
function validateExitDelay() {
  // 确保值不为负数
  if (Number.isNaN(exitDelay.value) || exitDelay.value < 0) {
    exitDelay.value = 0
  }
  // 保留一位小数
  exitDelay.value = Math.round(exitDelay.value * 10) / 10
  saveExitDelay()
}

// 跳转到调试页面
function goToDebug() {
  router.push('/debug')
}

onMounted(() => {
  loadExitDelay()
})
</script>

<style scoped>
.container {
  max-width: 600px;
}
</style>
