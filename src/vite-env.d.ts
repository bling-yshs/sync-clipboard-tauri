/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // biome-ignore lint/complexity/noBannedTypes: any
  // biome-ignore lint/suspicious/noExplicitAny: any
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 为 vconsole 添加全局类型声明
declare global {
  interface Window {
    vConsole?: {
      log: (message: string) => void
      info: (message: string) => void
      warn: (message: string) => void
      error: (message: string) => void
    }
  }
}
