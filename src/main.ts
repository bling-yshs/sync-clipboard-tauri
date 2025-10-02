import { getCurrent, onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { exists, readTextFile, remove } from '@tauri-apps/plugin-fs'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router'
import './assets/main.css'

// 处理Deep Link URL的函数
async function handleDeepLinkUrls(urls?: string[] | null) {
  if (!urls?.length) return

  console.log('收到Deep Link URLs:', urls)

  try {
    const url = new URL(urls[0])
    console.log('解析URL:', url.toString())

    // 检查是否是上传剪贴板的链接
    if (url.pathname.includes('/upload-clipboard')) {
      console.log('检测到剪贴板上传请求，准备跳转到上传页面')

      // 跳转到上传页面
      await router.replace('/upload-clipboard')

      console.log('已跳转到剪贴板上传页面')
    }
    // 检查是否是下载剪贴板的链接
    else if (url.pathname.includes('/download-clipboard')) {
      console.log('检测到剪贴板下载请求，准备跳转到下载页面')

      // 跳转到下载页面
      await router.replace('/download-clipboard')

      console.log('已跳转到剪贴板下载页面')
    }
  } catch (error) {
    console.error('处理Deep Link URL时出错:', error)
  }
}

// 检查fallback deep link文件
async function checkDeepLinkFallback() {
  try {
    const fallbackFilePath = 'deep_link_fallback.json'

    if (await exists(fallbackFilePath)) {
      console.log('发现deep link fallback文件')

      const content = await readTextFile(fallbackFilePath)
      const data = JSON.parse(content)

      console.log('Fallback数据:', data)

      if (data.fromTileFallback && data.url) {
        // 处理fallback URL
        await handleDeepLinkUrls([data.url])

        // 删除已处理的文件
        await remove(fallbackFilePath)
        console.log('已删除fallback文件')
      }
    }
  } catch (error) {
    console.error('检查deep link fallback文件时出错（可能是正常情况）:', error)
  }
}

// 初始化应用
async function initApp() {
  const app = createApp(App).use(router)

  // 1) 冷启动：获取启动时的URL
  try {
    const startUrls = await getCurrent()
    console.log('冷启动获取到的URLs:', startUrls)
    await handleDeepLinkUrls(startUrls)
  } catch (error) {
    console.error('获取启动URL失败（可能是正常情况）:', error)
  }

  // 2) 检查fallback deep link文件
  await checkDeepLinkFallback()

  // 3) 热启动：监听运行中的URL
  try {
    await onOpenUrl(async (urls) => {
      console.log('热启动收到URLs:', urls)
      await handleDeepLinkUrls(urls)
    })
  } catch (error) {
    console.error('设置URL监听器失败（可能是正常情况）:', error)
  }

  // 4) 定期检查fallback文件（用于处理应用已运行时的磁贴点击）
  setInterval(async () => {
    await checkDeepLinkFallback()
  }, 1000) // 每秒检查一次

  app.mount('#app')
}

// 启动应用
initApp()

// vConsole 默认隐藏，可在调试页面手动开启
// new VConsole()
