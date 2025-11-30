package app.tauri.sharetarget

import android.app.Activity
import android.net.Uri
import android.os.Parcelable
import android.content.Intent
import android.content.Context
import android.provider.OpenableColumns
import android.util.Log
import android.webkit.WebView
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

@InvokeArg
class PingArgs {
    var value: String? = null
}

@TauriPlugin
class ShareTargetPlugin(private val activity: Activity) : Plugin(activity) {
    private val implementation = ShareTarget()

    // 冷启动时缓存下来的分享数据（只用一次）
    private var initialSharePayload: JSObject? = null

    @Command
    fun ping(invoke: Invoke) {
        val args = invoke.parseArgs(PingArgs::class.java)
        val ret = JSObject()
        ret.put("value", implementation.pong(args.value ?: "default value :("))
        invoke.resolve(ret)
    }

    /**
     * 插件加载时调用（冷启动会走到这里）
     * 这里用 activity.intent 处理第一次启动时的分享 Intent
     */
    override fun load(webView: WebView) {
        super.load(webView)

        val intent = activity.intent
        if (intent != null && intent.action == Intent.ACTION_SEND) {
            Log.i("ShareTarget", "handling initial share intent in load()")
            initialSharePayload = buildSharePayloadFromIntent(intent)
            // ⚠️ 冷启动这里不要 trigger("share", ...)：
            // 此时前端还没开始监听事件，会直接丢失。
            // 只缓存起来，等前端通过 command 主动拉取。
        }
    }

    /**
     * 冷启动时前端调用这个命令主动获取分享数据
     * 调用一次后就清空缓存，避免重复使用
     */
    @Command
    fun getInitialShare(invoke: Invoke) {
        val payload = initialSharePayload
        // 只用一次，用完就丢，防止重复消费
        initialSharePayload = null
        if (payload != null) {
            Log.i("ShareTarget", "returning initial share payload to frontend")
            invoke.resolve(payload)
        } else {
            Log.i("ShareTarget", "no initial share payload")
            invoke.resolve(null)
        }
    }

    /// 热启动时（App 已在后台）新的分享 Intent 会走这里
    override fun onNewIntent(intent: Intent) {
        if (intent.action == Intent.ACTION_SEND) {
            val payload = buildSharePayloadFromIntent(intent)
            Log.i("ShareTarget", "triggering share event from onNewIntent: $payload")
            trigger("share", payload)
        }
    }

    /**
     * 把 Intent 统一转换成 JSObject 的工具函数
     * 冷启动和热启动都复用这块逻辑
     */
    private fun buildSharePayloadFromIntent(intent: Intent): JSObject {
        val payload = intentToJson(intent)

        // 尽量直接拿 Uri，不要 toString 再 parse
        val targetUri: Uri? = intent.getParcelableExtra(Intent.EXTRA_STREAM)
        if (targetUri != null) {
            val name = getNameFromUri(activity.applicationContext, targetUri)
            if (!name.isNullOrEmpty()) {
                payload.put("name", name)
                Log.i("ShareTarget", "got name: $name")
            }
        }

        return payload
    }
}

fun intentToJson(intent: Intent): JSObject {
    val json = JSObject()
    Log.i("processing", intent.toUri(0))
    json.put("uri", intent.toUri(0))
    json.put("content_type", intent.type)
    val streamUrl = intent.extras?.get("android.intent.extra.STREAM")
    if (streamUrl != null) {
        json.put("stream", streamUrl)
    }
    return json
}

fun getNameFromUri(context: Context, uri: Uri): String? {
    var displayName: String? = ""
    val projection = arrayOf(OpenableColumns.DISPLAY_NAME)
    val cursor =
        context.contentResolver.query(uri, projection, null, null, null)
    if (cursor != null) {
        cursor.moveToFirst()
        val columnIdx = cursor.getColumnIndex(projection[0])
        displayName = cursor.getString(columnIdx)
        cursor.close()
    }
    if (displayName.isNullOrEmpty()) {
        displayName = uri.lastPathSegment
    }
    return displayName
}
