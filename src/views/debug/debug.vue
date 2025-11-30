<template>
  <div class="container mx-auto p-6 pb-20">
    <h1 class="text-2xl font-bold mb-6">调试页面</h1>
    
    <div class="space-y-4">
      <!-- 页面跳转测试 -->
      <div class="bg-white rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-4">页面跳转测试</h2>
        <div class="grid grid-cols-1 gap-3">
          <Button @click="goToUploadClipboard" variant="outline" class="bg-blue-600 hover:bg-blue-700 text-white">
            跳转到剪贴板上传页面
          </Button>
          <Button @click="goToDownloadClipboard" variant="outline" class="bg-purple-600 hover:bg-purple-700 text-white">
            跳转到剪贴板下载页面
          </Button>
        </div>
      </div>

      <!-- 功能测试 -->
      <div class="bg-white rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-4">功能测试</h2>
        <div class="grid grid-cols-1 gap-3">
          <Button @click="testToast" variant="secondary">
            测试 Toast 消息
          </Button>
          <Button @click="testButton" variant="default">
            测试按钮
          </Button>
        </div>
      </div>

      <!-- 开发者工具 -->
      <div class="bg-white rounded-lg shadow p-4">
        <h2 class="text-lg font-semibold mb-4">开发者工具</h2>
        <div class="grid grid-cols-1 gap-3">
          <Button @click="toggleVConsole" :variant="vConsoleVisible ? 'destructive' : 'default'">
            {{ vConsoleVisible ? '隐藏 vConsole' : '显示 vConsole' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { showToast } from '@bling-yshs/tauri-plugin-toast'
import { readText } from '@tauri-apps/plugin-clipboard-manager'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'

const router = useRouter()
const vConsoleVisible = ref(false)

// vConsole 状态的 localStorage 键名
const VCONSOLE_STATE_KEY = 'vConsoleVisible'

// 跳转到剪贴板上传页面
function goToUploadClipboard() {
  router.push('/upload-clipboard')
}

// 跳转到剪贴板下载页面
function goToDownloadClipboard() {
  router.push('/download-clipboard')
}

// 测试 Toast 消息
async function testToast() {
  try {
    await showToast('这是一个测试消息！🎉', 'long')
    console.log('Toast 测试成功')
  } catch (error) {
    console.error('Toast 测试失败:', error)
  }
}

// 测试按钮
async function testButton() {
  console.log('测试按钮被点击了！')
  let s = await readText()
  console.log(`s: ${s}`)
}

// 显示 vConsole
function showVConsole() {
  // 如果已经存在实例，直接返回
  if (window.vConsole) {
    vConsoleVisible.value = true
    localStorage.setItem(VCONSOLE_STATE_KEY, 'true')
    return
  }
  
  import('vconsole')
    .then((VConsole) => {
      // 创建 vConsole 实例
      const vConsoleInstance = new VConsole.default()
      // 将实例保存到 window 对象
      window.vConsole = vConsoleInstance
      vConsoleVisible.value = true
      // 保存状态到 localStorage
      localStorage.setItem(VCONSOLE_STATE_KEY, 'true')
      console.log('vConsole 已显示')
    })
    .catch((error) => {
      console.error('加载 vConsole 失败:', error)
    })
}

// 隐藏 vConsole
function hideVConsole() {
  if (window.vConsole) {
    window.vConsole.destroy()
    window.vConsole = null
  }
  vConsoleVisible.value = false
  // 保存状态到 localStorage
  localStorage.setItem(VCONSOLE_STATE_KEY, 'false')
  console.log('vConsole 已隐藏')
}

// 切换 vConsole 显示状态
function toggleVConsole() {
  if (vConsoleVisible.value) {
    hideVConsole()
  } else {
    showVConsole()
  }
}

// 组件挂载时检查 vConsole 状态
onMounted(() => {
  // 检查是否已经在 main.ts 中创建了 vConsole 实例
  if (window.vConsole) {
    vConsoleVisible.value = true
  }
})
</script>

<style scoped>
.container {
  max-width: 600px;
}
</style>
