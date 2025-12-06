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

      <!-- 显示文件信息 -->
      <div v-if="sharedFileInfo" class="text-sm text-gray-500 mt-4">
        <p>文件名: {{ sharedFileInfo.name }}</p>
        <p>类型: {{ getFileTypeLabel(sharedFileInfo.type) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { showToast } from '@bling-yshs/tauri-plugin-toast'
import { fetch } from '@tauri-apps/plugin-http'
import { readFile } from '@tauri-apps/plugin-fs'
import { exit, isForeground } from 'tauri-plugin-quicktile-api'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ClipboardDataType, createFileClipboardData, type FileClipboardData } from '@/entities/clipboard-data'
import { useClipboardService } from '@/services/clipboard-service'
import { getExitDelay } from '@/utils/settings'
import CryptoJS from 'crypto-js'

const router = useRouter()

// 使用剪贴板服务
const { serverConfig, loadConfig, createFileDownloadUrl } = useClipboardService()

// 上传状态
const uploadStatus = ref<'uploading' | 'success' | 'error'>('uploading')
const statusMessage = ref('正在接收分享内容...')

// 分享文件信息
const sharedFileInfo = ref<{ name: string; type: string } | null>(null)

// 获取友好的文件类型标签
function getFileTypeLabel(mimeType: string): string {
  if (mimeType.startsWith('image/')) {
    return '图片'
  } else if (mimeType.startsWith('video/')) {
    return '视频'
  } else if (mimeType.startsWith('text/')) {
    return '文本'
  } else {
    return '文件'
  }
}

// 计算文件的 MD5 哈希值
function calculateMD5(data: Uint8Array): string {
  const wordArray = CryptoJS.lib.WordArray.create(data as unknown as number[])
  return CryptoJS.MD5(wordArray).toString()
}

// 获取文件扩展名
function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1] : ''
}

// 上传分享的文件到服务器
async function uploadSharedFile(filePath: string, fileName: string, contentType: string) {
  try {
    while (!(await isForeground())) {
      console.log('App 不在前台，延迟 200ms 重试')
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    console.log('App 在前台，开始读取分享文件')

    // 读取文件内容
    const fileData = await readFile(filePath)
    console.log(`成功读取文件，大小: ${fileData.length} 字节`)

    // 计算 MD5 哈希值
    const md5Hash = calculateMD5(fileData)
    console.log(`文件 MD5: ${md5Hash}`)

    // 根据 MIME 类型判断是图片还是普通文件
    const isImage = contentType.startsWith('image/')
    const isVideo = contentType.startsWith('video/')
    const fileType = isImage ? ClipboardDataType.Image : ClipboardDataType.File

    console.log(`文件类型判断: ${contentType} -> ${isImage ? '图片' : isVideo ? '视频' : '文件'}`)

    // 生成新文件名：使用 MD5 + 原始扩展名
    const extension = getFileExtension(fileName)
    const newFileName = extension ? `${md5Hash}.${extension}` : md5Hash

    // 构建剪贴板数据对象
    const clipboardData: FileClipboardData = createFileClipboardData(fileType, newFileName, md5Hash)
    const jsonStr = JSON.stringify(clipboardData)

    // 创建 Basic Auth header
    const credentials = btoa(`${serverConfig.value.username}:${serverConfig.value.password}`)

    // 1. 上传文件到服务器
    const fileUploadUrl = createFileDownloadUrl(newFileName)
    console.log(`上传文件到: ${fileUploadUrl}`)

    const fileResponse = await fetch(fileUploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': contentType,
      },
      body: fileData,
    })

    if (!fileResponse.ok) {
      throw new Error(`文件上传失败 HTTP ${fileResponse.status}: ${fileResponse.statusText}`)
    }

    console.log('文件上传成功')

    // 2. 更新 SyncClipboard.json
    const baseUrl = serverConfig.value.url.replace(/\/+$/, '')
    const syncClipboardUrl = `${baseUrl}/SyncClipboard.json`

    const jsonResponse = await fetch(syncClipboardUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: jsonStr,
    })

    if (!jsonResponse.ok) {
      throw new Error(`元数据上传失败 HTTP ${jsonResponse.status}: ${jsonResponse.statusText}`)
    }

    console.log('元数据上传成功')
    return true
  } catch (err: any) {
    console.error('上传失败:', err.message || '未知错误')
    throw err
  }
}

// 处理分享事件
async function handleShareEvent(filePath: string, fileName: string, contentType: string) {
  console.log('收到分享事件:', { filePath, fileName, contentType })

  try {
    // 首先加载配置
    console.log('正在加载配置...')
    await loadConfig()

    // 更新状态
    statusMessage.value = '正在上传文件...'
    sharedFileInfo.value = {
      name: fileName,
      type: contentType,
    }

    // 上传文件
    console.log('开始上传分享的文件...')
    await uploadSharedFile(filePath, fileName, contentType)
    await showToast('文件上传成功！🎉', 'long')

    // 上传成功，更新状态
    uploadStatus.value = 'success'
    statusMessage.value = '文件上传成功！🎉'
    console.log('文件上传成功！')

    // 根据设置的延迟时间退出程序
    const delaySeconds = getExitDelay()
    if (delaySeconds === -1) {
      // -1 表示不自动退出，返回主页面
      console.log('设置为不自动退出，返回主页面')
      await router.push('/home')
    } else if (delaySeconds === 0) {
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
    // 即使失败也跳转回home页面
    setTimeout(async () => {
      await router.push('/home')
    }, 2000)
  }
}

// 从 sessionStorage 读取分享数据并处理
async function handleShareFromStorage() {
  const shareEventData = sessionStorage.getItem('shareEvent')
  if (shareEventData) {
    try {
      const { filePath, fileName, contentType } = JSON.parse(shareEventData)
      // 清除已处理的数据
      sessionStorage.removeItem('shareEvent')
      // 处理分享事件
      await handleShareEvent(filePath, fileName, contentType)
    } catch (error) {
      console.error('处理分享数据失败:', error)
      uploadStatus.value = 'error'
      statusMessage.value = '处理分享数据失败'
    }
  } else {
    console.warn('未找到分享数据')
    uploadStatus.value = 'error'
    statusMessage.value = '未找到分享数据'
    setTimeout(async () => {
      await router.push('/home')
    }, 2000)
  }
}

// 组件挂载时自动处理
onMounted(async () => {
  console.log('分享上传页面已挂载，开始处理分享数据...')
  await handleShareFromStorage()
})

// 暴露方法
defineExpose({
  handleShareEvent,
})
</script>

<style scoped>
.container {
  max-width: 1200px;
}
</style>

