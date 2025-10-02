/**
 * 剪贴板数据类型枚举
 * 定义了所有支持的剪贴板数据类型
 */
export enum ClipboardDataType {
  /** 纯文本类型 */
  Text = 'Text',
  /** 图片文件类型 */
  Image = 'Image',
  /** 普通文件类型 */
  File = 'File',
  /** 文件组类型 */
  Group = 'Group',
}

/**
 * 剪贴板数据基础接口
 * 定义了所有剪贴板数据的通用结构
 */
export interface ClipboardData {
  /** 数据类型 */
  Type: ClipboardDataType
  /** 剪贴板内容或哈希值，可选字段 */
  Clipboard?: string
  /** 文件名，对于文件类型必填 */
  File: string
}

/**
 * 文本类型剪贴板数据接口
 * 用于纯文本内容的剪贴板数据
 */
export interface TextClipboardData extends ClipboardData {
  Type: ClipboardDataType.Text
  /** 文本内容（通常是Unicode编码） */
  Clipboard: string
  /** 文本类型时文件名为空 */
  File: ''
}

/**
 * 文件类型剪贴板数据接口
 * 用于文件、图片等类型的剪贴板数据
 */
export interface FileClipboardData extends ClipboardData {
  Type: ClipboardDataType.Image | ClipboardDataType.File
  /** 文件的MD5哈希值，可选 */
  Clipboard?: string
  /** 文件名 */
  File: string
}

/**
 * 组类型剪贴板数据接口
 * 用于文件组类型的剪贴板数据，包含ZIP文件
 */
export interface GroupClipboardData extends ClipboardData {
  Type: ClipboardDataType.Group
  /** 文件的MD5哈希值，可选 */
  Clipboard?: string
  /** ZIP文件名 */
  File: string
}

/**
 * 剪贴板数据联合类型
 * 包含所有可能的剪贴板数据类型
 */
export type AnyClipboardData = TextClipboardData | FileClipboardData | GroupClipboardData

/**
 * 类型守卫：检查是否为文本类型数据
 * @param data 剪贴板数据
 * @returns 如果是文本类型返回true
 */
export function isTextClipboardData(data: ClipboardData): data is TextClipboardData {
  return data.Type === ClipboardDataType.Text
}

/**
 * 类型守卫：检查是否为文件类型数据
 * @param data 剪贴板数据
 * @returns 如果是文件类型返回true
 */
export function isFileClipboardData(data: ClipboardData): data is FileClipboardData {
  return data.Type === ClipboardDataType.Image || data.Type === ClipboardDataType.File
}

/**
 * 类型守卫：检查是否为组类型数据
 * @param data 剪贴板数据
 * @returns 如果是组类型返回true
 */
export function isGroupClipboardData(data: ClipboardData): data is GroupClipboardData {
  return data.Type === ClipboardDataType.Group && typeof (data as GroupClipboardData).File === 'string'
}

/**
 * 创建文本类型剪贴板数据
 * @param content 文本内容
 * @returns 文本类型剪贴板数据
 */
export function createTextClipboardData(content: string): TextClipboardData {
  return {
    Type: ClipboardDataType.Text,
    Clipboard: content,
    File: '',
  }
}

/**
 * 创建文件类型剪贴板数据
 * @param type 文件类型
 * @param filename 文件名
 * @param hash 可选的MD5哈希值
 * @returns 文件类型剪贴板数据
 */
export function createFileClipboardData(
  type: ClipboardDataType.Image | ClipboardDataType.File,
  filename: string,
  hash?: string,
): FileClipboardData {
  return {
    Type: type,
    Clipboard: hash,
    File: filename,
  }
}

/**
 * 创建组类型剪贴板数据
 * @param filename ZIP文件名
 * @param hash 可选的MD5哈希值
 * @returns 组类型剪贴板数据
 */
export function createGroupClipboardData(filename: string, hash?: string): GroupClipboardData {
  return {
    Type: ClipboardDataType.Group,
    Clipboard: hash,
    File: filename,
  }
}

/**
 * 验证剪贴板数据格式是否正确
 * @param data 待验证的数据
 * @returns 如果格式正确返回true
 */

// biome-ignore lint/suspicious/noExplicitAny: any
export function validateClipboardData(data: any): data is ClipboardData {
  if (!data || typeof data !== 'object') {
    return false
  }

  // 检查Type字段
  if (!Object.values(ClipboardDataType).includes(data.Type)) {
    return false
  }

  // 检查File字段
  if (typeof data.File !== 'string') {
    return false
  }

  // 检查Clipboard字段（可选）
  if (data.Clipboard !== undefined && typeof data.Clipboard !== 'string') {
    return false
  }

  // 对于文本类型，Clipboard必须存在且File必须为空
  if (data.Type === ClipboardDataType.Text) {
    return typeof data.Clipboard === 'string' && data.File === ''
  }

  // 对于文件类型，File必须非空
  if (isFileClipboardData(data)) {
    return data.File.length > 0
  }

  // 对于组类型，File必须非空
  if (isGroupClipboardData(data)) {
    return data.File.length > 0
  }

  return true
}
