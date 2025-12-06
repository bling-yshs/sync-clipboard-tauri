<template>
  <div class="container mx-auto p-6 flex items-center justify-center min-h-screen">
    <div class="text-center space-y-4">
      <div v-if="downloadStatus === 'downloading'" class="text-lg text-gray-600">正在从服务器下载剪贴板内容...</div>
      <div v-else-if="downloadStatus === 'processing'" class="text-lg text-gray-600">正在处理下载的内容...</div>
      <div v-else-if="downloadStatus === 'downloading_file'" class="space-y-3">
        <div class="text-lg text-gray-600">正在下载文件: {{ currentFileName }}</div>
        <div class="w-full max-w-md mx-auto space-y-2">
          <Progress :model-value="downloadProgress" class="w-full" />
          <div class="flex justify-between text-sm text-gray-500">
            <span>{{ downloadProgress.toFixed(1) }}%</span>
            <span v-if="totalBytes > 0">{{ formatFileSize(downloadedBytes) }} / {{ formatFileSize(totalBytes) }}</span>
            <span v-else>{{ formatFileSize(downloadedBytes) }}</span>
          </div>
        </div>
      </div>
      <div v-else-if="downloadStatus === 'saving_file'" class="text-lg text-gray-600">正在保存文件到下载文件夹...</div>
      <div v-else-if="downloadStatus === 'unzipping'" class="text-lg text-gray-600">正在解压文件...</div>
      <div v-else-if="downloadStatus === 'saving_group'" class="text-lg text-gray-600">正在保存文件组...</div>
      <div v-else-if="downloadStatus === 'writing'" class="text-lg text-gray-600">正在写入剪贴板...</div>
      <div v-else-if="downloadStatus === 'success'" class="text-lg text-green-600">内容下载成功！正在退出...</div>
      <div v-else-if="downloadStatus === 'error'" class="text-lg text-red-600">{{ errorMessage }}</div>

      <div v-if="downloadStatus !== 'error' && downloadStatus !== 'downloading_file'" class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      
      <!-- 错误状态下显示重试按钮 -->
      <div v-if="downloadStatus === 'error'" class="space-y-2">
        <Button @click="retryDownload" variant="outline">重试下载</Button>
        <Button @click="goHome" variant="secondary">返回首页</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { showToast } from '@bling-yshs/tauri-plugin-toast'
import { join } from '@tauri-apps/api/path'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { exists, mkdir, writeFile } from '@tauri-apps/plugin-fs'
import { fetch } from '@tauri-apps/plugin-http'
import { unzipSync } from 'fflate'
import { exit, scanMediaFile } from 'tauri-plugin-quicktile-api'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  type ClipboardData,
  type FileClipboardData,
  type GroupClipboardData,
  isFileClipboardData,
  isGroupClipboardData,
  isTextClipboardData,
  type TextClipboardData,
  validateClipboardData,
} from '@/entities/clipboard-data'
import { useClipboardService } from '@/services/clipboard-service'
import { getExitDelay } from '@/utils/settings'

const router = useRouter()

// 使用剪贴板服务
const { serverConfig, fullFileUrl, loadConfig, unicodeToString, createFileDownloadUrl } = useClipboardService()

// 下载状态
const downloadStatus = ref<
  | 'downloading'
  | 'processing'
  | 'writing'
  | 'downloading_file'
  | 'saving_file'
  | 'unzipping'
  | 'saving_group'
  | 'success'
  | 'error'
>('downloading')
const errorMessage = ref('')

// 文件下载进度相关状态
const downloadProgress = ref(0) // 下载进度百分比 (0-100)
const downloadedBytes = ref(0) // 已下载字节数
const totalBytes = ref(0) // 总文件大小
const currentFileName = ref('') // 当前下载的文件名

// 格式化文件大小的辅助函数
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

// 生成唯一文件名的辅助函数
async function generateUniqueFileName(originalFileName: string): Promise<string> {
  const downloadDir = '/storage/emulated/0/Download'
  let finalFileName = originalFileName

  // 检查原始文件名是否存在
  const originalPath = await join(downloadDir, originalFileName)
  const fileExists = await exists(originalPath)

  if (fileExists) {
    // 如果文件存在，添加时间戳
    const timestamp = Math.floor(Date.now() / 1000) // 秒级时间戳

    // 分离文件名和扩展名
    const lastDotIndex = originalFileName.lastIndexOf('.')
    if (lastDotIndex === -1) {
      // 没有扩展名
      finalFileName = `${originalFileName}_${timestamp}`
    } else {
      // 有扩展名
      const nameWithoutExt = originalFileName.substring(0, lastDotIndex)
      const extension = originalFileName.substring(lastDotIndex)
      finalFileName = `${nameWithoutExt}_${timestamp}${extension}`
    }

    console.log(`文件 ${originalFileName} 已存在，重命名为: ${finalFileName}`)
  }

  return finalFileName
}

// 处理文本类型剪贴板数据
async function handleTextClipboard(data: TextClipboardData): Promise<void> {
  // 处理文本类型
  let clipboardText = ''
  if (data.Clipboard) {
    // 如果是Unicode编码的文本，需要解码
    clipboardText = unicodeToString(data.Clipboard)
  } else {
    throw new Error('文本类型数据中没有找到Clipboard字段')
  }

  if (!clipboardText) {
    throw new Error('剪贴板内容为空')
  }

  downloadStatus.value = 'writing'
  console.log('正在将文本内容写入剪贴板...')

  // 将内容写入系统剪贴板
  await writeText(clipboardText)

  downloadStatus.value = 'success'
  console.log('剪贴板文本内容下载并写入成功')

  // 使用 showToast 展示下载的剪贴板内容
  try {
    // 如果文本超过100字，截断并添加省略号
    const displayText = clipboardText.length > 100 ? `${clipboardText.substring(0, 100)}...` : clipboardText

    await showToast(`已将以下内容写入剪贴板:\n${displayText}`, 'long')
    console.log('已通过 Toast 展示剪贴板内容')
  } catch (toastError) {
    console.error('显示 Toast 失败:', toastError)
  }
}

// 处理文件类型剪贴板数据
async function handleFileClipboard(data: FileClipboardData, credentials: string): Promise<void> {
  // 处理文件类型和组类型
  const filename = data.File
  if (!filename) {
    throw new Error(`${data.Type}类型数据中没有找到File字段或文件名为空`)
  }

  console.log(`检测到${data.Type}类型，文件名: ${filename}`)

  // 初始化进度状态
  currentFileName.value = filename
  downloadProgress.value = 0
  downloadedBytes.value = 0
  totalBytes.value = 0

  downloadStatus.value = 'downloading_file'
  console.log('正在从服务器下载文件...')

  // 构建文件下载URL
  const fileDownloadUrl = createFileDownloadUrl(filename)
  console.log('文件下载URL:', fileDownloadUrl)

  // 下载文件
  const fileResponse = await fetch(fileDownloadUrl, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  })

  if (!fileResponse.ok) {
    throw new Error(`文件下载失败: HTTP ${fileResponse.status}: ${fileResponse.statusText}`)
  }

  // 获取文件总大小
  const contentLength = fileResponse.headers.get('Content-Length')
  if (contentLength) {
    totalBytes.value = Number.parseInt(contentLength, 10)
    console.log(`文件总大小: ${formatFileSize(totalBytes.value)}`)
  } else {
    console.log('无法获取文件总大小，将显示已下载大小')
  }

  // 使用流式读取来跟踪下载进度
  const reader = fileResponse.body?.getReader()
  if (!reader) {
    throw new Error('无法获取响应流读取器')
  }

  const chunks: Uint8Array[] = []
  let receivedLength = 0

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      if (value) {
        chunks.push(value)
        receivedLength += value.length
        downloadedBytes.value = receivedLength

        // 计算并更新进度
        if (totalBytes.value > 0) {
          downloadProgress.value = (receivedLength / totalBytes.value) * 100
        } else {
          // 如果无法获取总大小，显示一个基于已下载大小的估算进度
          downloadProgress.value = Math.min((receivedLength / (1024 * 1024)) * 10, 90) // 假设每MB增加10%，最大90%
        }

        console.log(`下载进度: ${downloadProgress.value.toFixed(1)}% (${formatFileSize(receivedLength)})`)
      }
    }
  } finally {
    reader.releaseLock()
  }

  // 如果没有总大小信息，设置进度为100%
  if (totalBytes.value === 0) {
    downloadProgress.value = 100
    totalBytes.value = receivedLength
  }

  downloadStatus.value = 'saving_file'
  console.log('正在保存文件到下载文件夹...')

  // 合并所有数据块
  const fileContents = new Uint8Array(receivedLength)
  let position = 0
  for (const chunk of chunks) {
    fileContents.set(chunk, position)
    position += chunk.length
  }

  // 生成唯一文件名（如果文件已存在则添加时间戳）
  const uniqueFileName = await generateUniqueFileName(filename)
  const downloadPath = `/storage/emulated/0/Download/${uniqueFileName}`

  // 保存文件到下载文件夹
  await writeFile(downloadPath, fileContents)
  await scanMediaFile(downloadPath)

  downloadStatus.value = 'success'
  console.log(`文件已成功保存到: ${downloadPath}`)

  // 显示文件下载成功的提示
  try {
    await showToast(`文件已下载到下载文件夹:\n${uniqueFileName}`, 'long')
    console.log('已通过 Toast 展示文件下载成功信息')
  } catch (toastError) {
    console.error('显示 Toast 失败:', toastError)
  }
}

// 处理组类型剪贴板数据
async function handleGroupClipboard(data: GroupClipboardData, credentials: string): Promise<void> {
  // 处理组类型
  const filename = data.File
  if (!filename) {
    throw new Error('组类型数据中没有找到File字段或文件名为空')
  }

  console.log(`检测到Group类型，文件名: ${filename}`)

  // 初始化进度状态
  currentFileName.value = filename
  downloadProgress.value = 0
  downloadedBytes.value = 0
  totalBytes.value = 0

  downloadStatus.value = 'downloading_file'
  console.log('正在从服务器下载ZIP文件...')

  // 构建文件下载URL
  const fileDownloadUrl = createFileDownloadUrl(filename)
  console.log('文件下载URL:', fileDownloadUrl)

  // 下载文件
  const fileResponse = await fetch(fileDownloadUrl, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  })

  if (!fileResponse.ok) {
    throw new Error(`文件下载失败: HTTP ${fileResponse.status}: ${fileResponse.statusText}`)
  }

  // 获取文件总大小
  const contentLength = fileResponse.headers.get('Content-Length')
  if (contentLength) {
    totalBytes.value = Number.parseInt(contentLength, 10)
    console.log(`文件总大小: ${formatFileSize(totalBytes.value)}`)
  } else {
    console.log('无法获取文件总大小，将显示已下载大小')
  }

  // 使用流式读取来跟踪下载进度
  const reader = fileResponse.body?.getReader()
  if (!reader) {
    throw new Error('无法获取响应流读取器')
  }

  const chunks: Uint8Array[] = []
  let receivedLength = 0

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      if (value) {
        chunks.push(value)
        receivedLength += value.length
        downloadedBytes.value = receivedLength

        // 计算并更新进度
        if (totalBytes.value > 0) {
          downloadProgress.value = (receivedLength / totalBytes.value) * 100
        } else {
          // 如果无法获取总大小，显示一个基于已下载大小的估算进度
          downloadProgress.value = Math.min((receivedLength / (1024 * 1024)) * 10, 90) // 假设每MB增加10%，最大90%
        }

        console.log(`下载进度: ${downloadProgress.value.toFixed(1)}% (${formatFileSize(receivedLength)})`)
      }
    }
  } finally {
    reader.releaseLock()
  }

  // 如果没有总大小信息，设置进度为100%
  if (totalBytes.value === 0) {
    downloadProgress.value = 100
    totalBytes.value = receivedLength
  }

  downloadStatus.value = 'unzipping'
  console.log('正在解压ZIP文件...')

  // 合并所有数据块
  const fileContents = new Uint8Array(receivedLength)
  let position = 0
  for (const chunk of chunks) {
    fileContents.set(chunk, position)
    position += chunk.length
  }

  // 创建目标目录
  const baseDownloadDir = '/storage/emulated/0/Download'
  const dirName = `SyncClipboard_${Date.now()}`
  const destinationDir = await join(baseDownloadDir, dirName)
  await mkdir(destinationDir, { recursive: true })
  console.log(`创建解压目录: ${destinationDir}`)

  // 解压文件
  const files = unzipSync(fileContents)
  console.log(`解压完成，共 ${Object.keys(files).length} 个文件/文件夹`)

  downloadStatus.value = 'saving_group'
  console.log('正在保存解压后的文件...')

  // 遍历并保存文件/目录
  for (const [rawPath, data] of Object.entries(files)) {
    const fullPath = await join(destinationDir, rawPath)
    if (rawPath.endsWith('/')) {
      // 如果是目录，则创建它
      await mkdir(fullPath, { recursive: true })
      console.log(`创建目录: ${fullPath}`)
    } else {
      // 如果是文件，则写入它
      await writeFile(fullPath, data)
      console.log(`保存文件: ${fullPath}`)
    }
  }

  downloadStatus.value = 'success'
  console.log(`文件组已成功解压到: ${destinationDir}`)

  // 显示文件组解压成功的提示
  try {
    await showToast(`文件组已解压到下载文件夹中的\n${dirName}`, 'long')
    console.log('已通过 Toast 展示文件组解压成功信息')
  } catch (toastError) {
    console.error('显示 Toast 失败:', toastError)
  }
}

// 从服务器下载JSON数据并写入剪贴板
async function downloadClipboardContent() {
  try {
    downloadStatus.value = 'downloading'
    console.log('开始从服务器下载剪贴板内容...')

    // 创建 Basic Auth header
    const credentials = btoa(`${serverConfig.value.username}:${serverConfig.value.password}`)

    // 使用 fetch API 发送 GET 请求
    const response = await fetch(fullFileUrl.value, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    downloadStatus.value = 'processing'
    console.log('下载成功，正在处理JSON内容...')

    // 获取响应文本
    const jsonText = await response.text()

    // 解析JSON
    let jsonData: ClipboardData
    try {
      const parsedData = JSON.parse(jsonText)
      if (!validateClipboardData(parsedData)) {
        throw new Error('服务器返回的JSON数据格式无效')
      }
      jsonData = parsedData
    } catch (parseError) {
      throw new Error(`JSON解析失败: ${parseError}`)
    }

    console.log('解析的JSON数据:', jsonData)
    console.log('数据类型:', jsonData.Type)

    if (isTextClipboardData(jsonData)) {
      await handleTextClipboard(jsonData)
    } else if (isFileClipboardData(jsonData)) {
      await handleFileClipboard(jsonData, credentials)
    } else if (isGroupClipboardData(jsonData)) {
      await handleGroupClipboard(jsonData, credentials)
    } else {
      throw new Error(`不支持的数据类型: ${jsonData.Type}`)
    }

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

    // biome-ignore lint/suspicious/noExplicitAny: any
  } catch (err: any) {
    console.error('下载失败:', err.message || '未知错误')
    downloadStatus.value = 'error'
    errorMessage.value = `下载失败: ${err.message || '未知错误'}`
  }
}

// 重置进度状态
function resetProgressState() {
  downloadProgress.value = 0
  downloadedBytes.value = 0
  totalBytes.value = 0
  currentFileName.value = ''
}

// 重试下载
async function retryDownload() {
  errorMessage.value = ''
  resetProgressState()
  await downloadClipboardContent()
}

// 返回首页
function goHome() {
  router.push('/home')
}

onMounted(async () => {
  console.log('剪贴板下载页面已挂载，开始下载流程...')

  try {
    // 首先加载配置
    console.log('正在加载配置...')
    await loadConfig()

    // 开始下载流程
    await downloadClipboardContent()
  } catch (error) {
    console.error('初始化失败:', error)
    downloadStatus.value = 'error'
    errorMessage.value = `初始化失败: ${error instanceof Error ? error.message : '未知错误'}`
  }
})
</script>

<style scoped>
.container {
  max-width: 1200px;
}
</style>
