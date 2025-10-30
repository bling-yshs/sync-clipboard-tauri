import {invoke} from '@tauri-apps/api/core'

export async function ping(value: string): Promise<string | null> {
  return await invoke<{value?: string}>('plugin:quicktile|ping', {
    payload: {
      value,
    },
  }).then((r) => (r.value ? r.value : null));
}

export async function showToast(
  message: string,
  duration: 'short' | 'long' = 'short'
): Promise<boolean> {
  return await invoke<{success?: boolean}>('plugin:quicktile|show_toast', {
    payload: {
      message,
      duration,
    },
  }).then((r) => r.success || false);
}

export async function scanMediaFile(path: string): Promise<boolean> {
  return await invoke<{success?: boolean}>('plugin:quicktile|scan_media_file', {
    payload: {
      path,
    },
  }).then((r) => r.success || false);
}

export async function exit(): Promise<void> {
  await invoke('plugin:quicktile|exit')
}

export async function isForeground(): Promise<boolean> {
    return await invoke('plugin:quicktile|is_foreground')
}
