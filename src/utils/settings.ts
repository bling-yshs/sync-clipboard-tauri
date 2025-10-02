// 获取延迟退出时间（秒）
export function getExitDelay(): number {
  const saved = localStorage.getItem('exitDelay')
  return saved ? Number.parseFloat(saved) : 0
}

// 保存延迟退出时间
export function setExitDelay(seconds: number): void {
  localStorage.setItem('exitDelay', seconds.toString())
}
