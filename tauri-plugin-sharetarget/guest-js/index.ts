import { addPluginListener, invoke, PluginListener } from '@tauri-apps/api/core'

/** A ping function that lets you check that the plugin is alive.
*/
export async function ping(value: string): Promise<string | null> {
  return await invoke<{value?: string}>('plugin:sharetarget|ping', {
    payload: {
      value,
    },
  }).then((r) => (r.value ? r.value : null));
}

/** A ShareEvent intent imported from Android. The filename is not implemented, sorry.
*/
export type ShareEvent = {
    /** the name of the intent's target file */
    name?: string,
    /** the streamable uri to the target contents */
    stream?: string,
    /** the target file's MIME type */
    content_type?: string,
    /** the complete URI for the Android Intent (with action, type, etc.) */
    uri: string,
}

/** Use callback on all ShareEvent intents sent by Android.
 */
export async function listenForShareEvents(
    callback: (event: ShareEvent) => void
): Promise<PluginListener> {
    return await addPluginListener('sharetarget', 'share', callback);
}

/** Get initial share data from cold start.
 * Returns the share payload when available, otherwise `null`.
 * This function should be called only once after app startup to retrieve any pending share data.
 * After calling this, the internal share data cache will be cleared.
 */
export async function getInitialShare(): Promise<ShareEvent | null> {
    return await invoke<ShareEvent | null>('plugin:sharetarget|get_initial_share');
}
