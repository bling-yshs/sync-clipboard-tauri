import { BaseDirectory, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml'
import { computed, type Ref, ref } from 'vue'

/**
 * 服务器配置接口
 */
export interface ServerConfig {
  url: string
  username: string
  password: string
}

/**
 * 测试结果接口
 */
export interface TestResult {
  success: boolean
  message: string
}

/**
 * 配置文件路径常量
 */
export const CONFIG_FILE = 'clipboard-sync-config.toml'

/**
 * 默认服务器配置
 */
export const DEFAULT_CONFIG: ServerConfig = {
  url: 'https://example.com/',
  username: '',
  password: '',
}

/**
 * 将字符串转换为 Unicode 编码表示形式
 * @param str 输入的字符串
 * @returns 返回 \uXXXX 格式的 Unicode 字符串
 * @example stringToUnicode("你好") // 输出 "\u4f60\u597d"
 */
export function stringToUnicode(str: string): string {
  let unicodeString = ''
  for (let i = 0; i < str.length; i++) {
    // 获取字符的 Unicode 码点 (十进制)
    const code = str.charCodeAt(i)
    // 转换为十六进制，并补全为4位
    const hexCode = code.toString(16).padStart(4, '0')
    // 拼接成 \uXXXX 格式
    unicodeString += `\\u${hexCode}`
  }
  return unicodeString
}

/**
 * 将 Unicode 编码字符串转换回原始字符串
 * @param unicodeStr 包含 \uXXXX 格式的 Unicode 字符串
 * @returns 返回解码后的原始字符串
 * @example unicodeToString("\u4f60\u597d") // => "你好"
 */
export function unicodeToString(unicodeStr: string): string {
  // 使用正则表达式匹配所有的 \uXXXX 格式
  return unicodeStr.replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex) => {
    // 将匹配到的十六进制码点转换为字符
    return String.fromCharCode(Number.parseInt(hex, 16))
  })
}

/**
 * 从 TOML 配置文件加载服务器配置
 * @param serverConfig 响应式配置对象
 * @returns Promise<void>
 */
export async function loadConfig(serverConfig: Ref<ServerConfig>): Promise<void> {
  try {
    const configContent = await readTextFile(CONFIG_FILE, {
      baseDir: BaseDirectory.AppData,
    })
    const parsedConfig = parseToml(configContent) as Partial<ServerConfig>
    serverConfig.value = { ...serverConfig.value, ...parsedConfig }
    console.log('Configuration loaded successfully')
  } catch (_error) {
    console.error('No saved configuration found, using defaults:', _error)
  }
}

/**
 * 保存服务器配置到 TOML 文件
 * @param serverConfig 响应式配置对象
 * @returns Promise<void>
 */
export async function saveConfig(serverConfig: Ref<ServerConfig>): Promise<void> {
  try {
    const tomlContent = stringifyToml(serverConfig.value)
    await writeTextFile(CONFIG_FILE, tomlContent, {
      baseDir: BaseDirectory.AppData,
    })
    console.log('Configuration saved successfully')
  } catch (error) {
    console.error('Failed to save configuration:', error)
    throw error
  }
}

/**
 * 创建完整文件 URL 的计算属性
 * @param serverConfig 响应式配置对象
 * @returns 计算属性，返回完整的文件 URL
 */
export function useFullFileUrl(serverConfig: Ref<ServerConfig>) {
  return computed(() => {
    const baseUrl = serverConfig.value.url.replace(/\/+$/, '') // 移除末尾的斜杠
    return `${baseUrl}/SyncClipboard.json`
  })
}

/**
 * 创建文件下载 URL 的函数
 * @param serverConfig 响应式配置对象
 * @param filename 文件名
 * @returns 完整的文件下载 URL
 */
export function createFileDownloadUrl(serverConfig: Ref<ServerConfig>, filename: string): string {
  const baseUrl = serverConfig.value.url.replace(/\/+$/, '') // 移除末尾的斜杠
  return `${baseUrl}/file/${filename}`
}

/**
 * 剪贴板服务 Composable
 * 提供完整的配置管理和 URL 计算功能
 * @param initialConfig 初始配置（可选）
 * @returns 包含配置管理功能的对象
 */
export function useClipboardService(initialConfig?: Partial<ServerConfig>) {
  // 创建响应式配置对象
  const serverConfig = ref<ServerConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  })

  // 创建完整文件 URL 的计算属性
  const fullFileUrl = useFullFileUrl(serverConfig)

  // 加载配置的包装函数
  const loadServerConfig = async () => {
    await loadConfig(serverConfig)
  }

  // 保存配置的包装函数
  const saveServerConfig = async () => {
    await saveConfig(serverConfig)
  }

  return {
    serverConfig,
    fullFileUrl,
    loadConfig: loadServerConfig,
    saveConfig: saveServerConfig,
    stringToUnicode,
    unicodeToString,
    createFileDownloadUrl: (filename: string) => createFileDownloadUrl(serverConfig, filename),
  }
}
