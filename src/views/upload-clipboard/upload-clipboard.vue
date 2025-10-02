<template>
  <div class="container mx-auto p-6 flex items-center justify-center min-h-screen">
    <div class="text-center space-y-4">
      <div class="text-lg" :class="{
        'text-gray-600': uploadStatus === 'uploading',
        'text-green-600': uploadStatus === 'success',
        'text-red-600': uploadStatus === 'error'
      }">
        {{ statusMessage }}
      </div>

      <!-- 上传中的加载动画 -->
      <div v-if="uploadStatus === 'uploading'"
           class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto">
      </div>

      <!-- 成功图标 -->
      <div v-else-if="uploadStatus === 'success'"
           class="text-green-500 text-4xl">
        ✅
      </div>

      <!-- 错误图标 -->
      <div v-else-if="uploadStatus === 'error'"
           class="text-red-500 text-4xl">
        ❌
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { showToast } from '@bling-yshs/tauri-plugin-toast'
import { readText } from '@tauri-apps/plugin-clipboard-manager'
import { fetch } from '@tauri-apps/plugin-http'
import { exit } from '@tauri-apps/plugin-process'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createTextClipboardData, type TextClipboardData } from '@/entities/clipboard-data'
import { useClipboardService } from '@/services/clipboard-service'
import { getExitDelay } from '@/utils/settings'

const router = useRouter()

// 使用剪贴板服务
const { serverConfig, fullFileUrl, loadConfig } = useClipboardService()

// 上传状态
const uploadStatus = ref<'uploading' | 'success' | 'error'>('uploading')
const statusMessage = ref('正在上传剪贴板内容...')

// 读取剪贴板纯文本并上传到服务器（使用 fetch API）
async function uploadClipboardText() {
  try {
    const text = await readText()
    if (text === null || text === undefined) {
      throw new Error('剪贴板中没有可用的纯文本')
    }

    console.log(`剪贴板的内容为: ${text}`)

    // 直接使用原始文本，不进行Unicode编码
    // 构建剪贴板数据对象
    const clipboardData: TextClipboardData = createTextClipboardData(text)
    const jsonStr = JSON.stringify(clipboardData)

    // 创建 Basic Auth header
    const credentials = btoa(`${serverConfig.value.username}:${serverConfig.value.password}`)

    // 使用 fetch API 发送 PUT 请求
    const response = await fetch(fullFileUrl.value, {
      method: 'PUT',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: jsonStr,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    console.log('剪贴板内容上传成功')
    return true
    // biome-ignore lint/suspicious/noExplicitAny: any
  } catch (err: any) {
    console.error('上传失败:', err.message || '未知错误')
    throw err
  }
}

onMounted(async () => {
  console.log('剪贴板上传页面已挂载，开始上传流程...')

  try {
    // 首先加载配置
    console.log('正在加载配置...')
    await loadConfig()

    // 自动读取剪贴板并上传
    console.log('开始剪贴板上传...')
    await uploadClipboardText()
    await showToast('剪贴板内容上传成功！🎉', 'long')

    // 上传成功，更新状态并显示提示
    uploadStatus.value = 'success'
    statusMessage.value = '剪贴板内容上传成功！🎉'
    console.log('剪贴板内容上传成功！')

    // 根据设置的延迟时间退出程序
    const delaySeconds = getExitDelay()
    if (delaySeconds === 0) {
      await exit()
    } else {
      setTimeout(async () => {
        await exit()
      }, delaySeconds * 1000)
    }
  } catch (error) {
    console.error('上传流程失败:', error)
    await showToast(`上传流程失败: ${error}`, 'long')
    uploadStatus.value = 'error'
    statusMessage.value = '上传失败，请重试'
    // 即使失败也跳转回home页面（可根据需求调整）
    setTimeout(async () => {
      await router.push('/home')
    }, 2000)
  }
})
</script>

<style scoped>
.container {
  max-width: 1200px;
}
</style>
