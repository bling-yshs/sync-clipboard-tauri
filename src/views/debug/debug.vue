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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'

const router = useRouter()
const vConsoleVisible = ref(false)

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

// 切换 vConsole 显示状态
function toggleVConsole() {
  if (vConsoleVisible.value) {
    // 隐藏 vConsole
    if (window.vConsole) {
      window.vConsole.destroy()
      window.vConsole = null
    }
    vConsoleVisible.value = false
    console.log('vConsole 已隐藏')
  } else {
    // 显示 vConsole
    import('vconsole')
      .then((VConsole) => {
        // 创建 vConsole 实例
        const vConsoleInstance = new VConsole.default()
        // 将实例保存到 window 对象
        window.vConsole = vConsoleInstance
        vConsoleVisible.value = true
        console.log('vConsole 已显示')
      })
      .catch((error) => {
        console.error('加载 vConsole 失败:', error)
      })
  }
}
</script>

<style scoped>
.container {
  max-width: 600px;
}
</style>
