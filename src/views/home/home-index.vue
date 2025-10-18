<template>
  <div class="container mx-auto p-6 pb-20 space-y-6">
    <div class="flex gap-4 flex-wrap">
      <Button @click="uploadFile" class="bg-blue-600 text-white hover:bg-blue-600">
        <Loader2Icon v-if="isUploading" class="mr-2 h-4 w-4 animate-spin" />
        {{ isUploading ? '上传中...' : '文件上传' }}
      </Button>
    </div>
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">剪贴板同步</h1>
      <p class="text-gray-600">配置 SyncClipboard 服务器信息</p>
    </div>

    <!-- 配置表单 -->
    <Card>
      <CardHeader>
        <CardTitle>服务器配置</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">服务器地址</label>
          <Input
            v-model="serverConfig.url"
            type="url"
            placeholder="输入服务器地址"
          />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">用户名</label>
          <Input
            v-model="serverConfig.username"
            placeholder="输入用户名"
          />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">密码</label>
          <div class="relative">
            <Input
              v-model="serverConfig.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="输入密码"
              class="pr-10"
            />
            <button
              type="button"
              @click="togglePasswordVisibility"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <EyeIcon v-if="!showPassword" class="h-4 w-4" />
              <EyeOffIcon v-else class="h-4 w-4" />
            </button>
          </div>
        </div>
        <div class="flex gap-2">
          <Button @click="testLogin" :disabled="isTestingLogin" class="flex-1">
            {{ isTestingLogin ? '测试中...' : '测试连接并保存' }}
          </Button>
        </div>
        <div v-if="testResult" class="mt-4 p-3 rounded-md"
             :class="testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
          <p class="text-sm font-medium" :class="testResult.success ? 'text-green-800' : 'text-red-800'">
            {{ testResult.success ? '✓ 连接成功' : '✗ 测试失败' }}
          </p>
          <p class="text-xs mt-1" :class="testResult.success ? 'text-green-600' : 'text-red-600'">
            {{ testResult.message }}
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- 使用说明 -->
    <Card>
      <CardHeader>
        <CardTitle>使用说明</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="text-sm text-gray-600">
          <p class="mb-2">📱 <strong>快速使用：</strong></p>
          <ul class="list-disc list-inside space-y-1 ml-4">
            <li>下拉通知栏，进入快速设置</li>
            <li>点击编辑按钮，添加"剪贴板上传"和"剪贴板下载"磁贴</li>
            <li>点击磁贴即可快速上传或下载剪贴板内容</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { showToast } from '@bling-yshs/tauri-plugin-toast'
import { basename } from '@tauri-apps/api/path'
import { open } from '@tauri-apps/plugin-dialog'
import { readFile } from '@tauri-apps/plugin-fs'
import { fetch } from '@tauri-apps/plugin-http'
import CryptoJS from 'crypto-js'
import { zipSync } from 'fflate'
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { type TestResult, useClipboardService } from '@/services/clipboard-service'

// 使用剪贴板服务
const { serverConfig, fullFileUrl, loadConfig, saveConfig } = useClipboardService()

// 测试状态
const isTestingLogin = ref(false)
const testResult = ref<TestResult | null>(null)
const isUploading = ref(false)

// 密码显示状态
const showPassword = ref(false)

// 切换密码显示状态
function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}

// 页面加载时读取保存的配置
onMounted(async () => {
  await loadConfig()
})

// 测试登录
async function testLogin() {
  isTestingLogin.value = true
  testResult.value = null

  try {
    // 创建 Basic Auth header
    const credentials = btoa(`${serverConfig.value.username}:${serverConfig.value.password}`)

    // 发送 GET 请求测试连接
    const response = await fetch(fullFileUrl.value, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    })

    if (response.ok) {
      // 连接成功，保存配置
      await saveConfig()
      testResult.value = {
        success: true,
        message: '配置已保存，可以开始使用剪贴板同步功能',
      }
    } else {
      testResult.value = {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
      }
    }
    // biome-ignore lint/suspicious/noExplicitAny: any
  } catch (error: any) {
    console.error(error)
    testResult.value = {
      success: false,
      message: error.message || '连接失败',
    }
  } finally {
    isTestingLogin.value = false
  }
}

// 判断文件是否为图片类型
function isImageFile(filename: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico']
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return imageExtensions.includes(extension)
}

// 计算文件的MD5哈希值
function calculateMD5(fileData: Uint8Array): string {
  // 将Uint8Array转换为WordArray
  const wordArray = CryptoJS.lib.WordArray.create(fileData)
  // 计算MD5哈希
  const hash = CryptoJS.MD5(wordArray)
  return hash.toString()
}

// 文件上传功能
async function uploadFile() {
  isUploading.value = true
  try {
    const selectedFiles = await open({
      multiple: true,
      directory: false,
    })

    if (selectedFiles === null || selectedFiles.length === 0) {
      console.log('用户取消了文件选择或未选择任何文件')
      isUploading.value = false
      return
    }

    await loadConfig()
    const credentials = btoa(`${serverConfig.value.username}:${serverConfig.value.password}`)

    if (selectedFiles.length === 1) {
      // --- 单文件上传逻辑 ---
      const filePath = selectedFiles[0]
      if (!filePath) {
        throw new Error('File path is undefined.')
      }
      const fileData = new Uint8Array(await readFile(filePath))
      const filename = await basename(filePath)
      const fileType = isImageFile(filename) ? 'Image' : 'File'
      const md5Hash = calculateMD5(fileData)

      // 1. 上传文件
      const fileUploadUrl = `${serverConfig.value.url.replace(/\/+$/, '')}/file/${filename}`
      const fileUploadResponse = await fetch(fileUploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/octet-stream',
        },
        body: new Blob([fileData]),
      })

      if (!fileUploadResponse.ok) {
        throw new Error(`文件上传失败: HTTP ${fileUploadResponse.status}: ${fileUploadResponse.statusText}`)
      }

      // 2. 发送JSON
      const jsonData = { Type: fileType, Clipboard: md5Hash, File: filename }
      const jsonResponse = await fetch(fullFileUrl.value, {
        method: 'PUT',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      })

      if (!jsonResponse.ok) {
        throw new Error(`JSON数据发送失败: HTTP ${jsonResponse.status}: ${jsonResponse.statusText}`)
      }
      await showToast('文件上传成功')
    } else {
      // --- 多文件上传逻辑 ---
      const filesToZip: Record<string, Uint8Array> = {}
      for (const filePath of selectedFiles) {
        const fileName = await basename(filePath)
        filesToZip[fileName] = new Uint8Array(await readFile(filePath))
      }

      const zippedData = zipSync(filesToZip)
      const zipFileName = `sync-clipboard-${Date.now()}.zip`

      // 1. 上传ZIP文件
      const fileUploadUrl = `${serverConfig.value.url.replace(/\/+$/, '')}/file/${zipFileName}`
      const fileUploadResponse = await fetch(fileUploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/octet-stream',
        },
        body: new Blob([zippedData as Uint8Array<ArrayBuffer>]),
      })

      if (!fileUploadResponse.ok) {
        throw new Error(`ZIP文件上传失败: HTTP ${fileUploadResponse.status}: ${fileUploadResponse.statusText}`)
      }

      // 2. 发送JSON
      const jsonData = { Type: 'Group', Clipboard: '', File: zipFileName }
      const jsonResponse = await fetch(fullFileUrl.value, {
        method: 'PUT',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      })

      if (!jsonResponse.ok) {
        throw new Error(`JSON数据发送失败: HTTP ${jsonResponse.status}: ${jsonResponse.statusText}`)
      }
      await showToast('文件组上传成功')
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    await showToast(`文件上传失败: ${error}`)
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped>
.container {
  max-width: 600px;
}
</style>
