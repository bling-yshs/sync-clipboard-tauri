import { getCurrent, onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { exists, readTextFile, remove } from '@tauri-apps/plugin-fs'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router/router'
import './assets/main.css'
import { getInitialShare, listenForShareEvents } from 'tauri-plugin-sharetarget-api'
import type { ShareEvent } from 'tauri-plugin-sharetarget-api'
import { isForeground } from 'tauri-plugin-quicktile-api'

// 处理Deep Link URL的函数
async function handleDeepLinkUrls(urls?: string[] | null) {
  if (!urls?.length) return

  console.log('收到Deep Link URLs:', urls)

  try {
    const urlString = urls[0]
    if (!urlString) return
    const url = new URL(urlString)
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

async function handleShareUpload(event: ShareEvent, source: string) {
  try {
    console.log(`[${source}] 收到分享数据:`, JSON.stringify(event))

    // 判断是文本分享还是文件分享
    if (event.text) {
      // 纯文本分享
      console.log(`[${source}] 检测到纯文本分享`)
      const shareData = {
        type: 'text',
        text: event.text,
        contentType: event.content_type || 'text/plain',
      }
      sessionStorage.setItem('shareEvent', JSON.stringify(shareData))
      console.log(`[${source}] 文本分享数据已写入 sessionStorage`, shareData)
    } else if (event.stream) {
      // 文件分享（图片、视频、文件等）
      console.log(`[${source}] 检测到文件分享`)
      const shareData = {
        type: 'file',
        filePath: event.stream,
        fileName: event.name || 'shared_file',
        contentType: event.content_type || 'application/octet-stream',
      }
      sessionStorage.setItem('shareEvent', JSON.stringify(shareData))
      console.log(`[${source}] 文件分享数据已写入 sessionStorage`, shareData)
    } else {
      console.error(`[${source}] 分享事件缺少有效数据（既没有 text 也没有 stream）`)
      return
    }

    if (router.currentRoute.value.path !== '/upload-share') {
      console.log(`[${source}] 跳转到 /upload-share`)
      await router.push('/upload-share')
    } else {
      console.log(`[${source}] 已经在 /upload-share，无需跳转`)
    }
  } catch (error) {
    console.error(`[${source}] 处理分享上传时出错:`, error)
  }
}

// 初始化应用
async function initApp() {
  console.log('🚀 开始初始化应用...')

  // 等待应用在前台时再执行主逻辑
  while (!(await isForeground())) {
    console.log('App 不在前台，延迟 200ms 重试')
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  console.log('App 在前台，开始初始化')

  console.log('步骤1: 创建Vue应用实例')
  let app
  try {
    app = createApp(App).use(router)
    console.log('✅ Vue应用实例创建成功')
  } catch (error) {
    console.error('❌ 创建Vue应用实例失败:', error)
    throw error
  }

  // 0) 恢复 vConsole 状态
  console.log('步骤2: 检查并恢复vConsole状态')
  const vConsoleState = localStorage.getItem('vConsoleVisible')
  if (vConsoleState === 'true') {
    try {
      console.log('检测到vConsole需要恢复，正在加载...')
      const VConsole = await import('vconsole')
      const vConsoleInstance = new VConsole.default()
      window.vConsole = vConsoleInstance
      console.log('vConsole 已自动恢复显示')
    } catch (error) {
      console.error('加载 vConsole 失败:', error)
    }
  } else {
    console.log('vConsole状态为隐藏，跳过恢复')
  }

  // 1) 冷启动：获取启动时的URL
  console.log('步骤3: 处理冷启动Deep Link')
  try {
    const startUrls = await getCurrent()
    console.log('冷启动获取到的URLs:', startUrls)
    await handleDeepLinkUrls(startUrls)
  } catch (error) {
    console.error('获取启动URL失败（可能是正常情况）:', error)
  }

  // 2) 检查fallback deep link文件
  console.log('步骤4: 检查fallback deep link文件')
  await checkDeepLinkFallback()

  // 3) 热启动：监听运行中的URL
  console.log('步骤5: 设置热启动URL监听器')
  try {
    await onOpenUrl(async (urls) => {
      console.log('热启动收到URLs:', urls)
      await handleDeepLinkUrls(urls)
    })
    console.log('热启动URL监听器设置完成')
  } catch (error) {
    console.error('设置URL监听器失败（可能是正常情况）:', error)
  }

  // 4) 定期检查fallback文件（用于处理应用已运行时的磁贴点击）
  console.log('步骤6: 启动fallback文件定时检查器')
  setInterval(async () => {
    await checkDeepLinkFallback()
  }, 1000) // 每秒检查一次

  // 挂载应用
  console.log('步骤7: 挂载Vue应用到DOM')
  try {
    app.mount('#app')
    console.log('✅ Vue应用挂载完成')
  } catch (error) {
    console.error('❌ Vue应用挂载失败:', error)
    throw error
  }
  
  console.log('步骤8: 检查初始分享数据')
  const initialShare = await getInitialShare()
  if (initialShare) {
    console.log('发现初始分享数据，开始处理...')
    await handleShareUpload(initialShare, 'getInitialShare')
  } else {
    console.log('getInitialShare 没有初始分享数据')
  }
  
  // 5) 在应用挂载后设置分享事件监听器
  console.log('步骤9: 设置分享事件监听器')
  try {
    console.log('开始设置分享事件监听器...')
    await listenForShareEvents(async (event: ShareEvent) => {
      await handleShareUpload(event, 'listenForShareEvents')
    })
    console.log('✅ 分享事件监听器已设置')
  } catch (error) {
    console.error('❌ 设置分享事件监听器失败:', error)
  }
  
  console.log('🎉 应用初始化完成！')
}

// 启动应用
initApp()

// vConsole 默认隐藏，可在调试页面手动开启
// new VConsole()
