// 全局类型声明
declare global {
  interface Window {
    vConsole?: {
      destroy(): void
    } | null
  }
}

export {}
