package com.plugin.quicktile

import android.app.Activity
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import app.tauri.plugin.Invoke

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.MediaScannerConnection
import android.os.Build
import android.webkit.WebView
import android.widget.Toast
import java.net.URL
@InvokeArg
class PingArgs {
  var value: String? = null
}

@InvokeArg
class ToastArgs {
  var message: String? = null
  var duration: String? = null
}

@InvokeArg
class ScanMediaFileArgs {
  var path: String? = null
}



@TauriPlugin
class ExamplePlugin(private val activity: Activity): Plugin(activity) {
    private val implementation = Example()

    @Command
    fun ping(invoke: Invoke) {
        val args = invoke.parseArgs(PingArgs::class.java)

        val ret = JSObject()
        ret.put("value", implementation.pong(args.value ?: "default value :("))
        invoke.resolve(ret)
    }

    @Command
    fun showToast(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(ToastArgs::class.java)
            val message = args.message ?: "Hello from Tauri!"
            val duration = when (args.duration) {
                "long" -> Toast.LENGTH_LONG
                else -> Toast.LENGTH_SHORT
            }

            // 确保在主线程中显示 Toast
            activity.runOnUiThread {
                Toast.makeText(activity, message, duration).show()
            }

            val ret = JSObject()
            ret.put("success", true)
            invoke.resolve(ret)
        } catch (e: Exception) {
            android.util.Log.e("TilePlugin", "显示Toast失败", e)
            val ret = JSObject()
            ret.put("success", false)
            invoke.resolve(ret)
        }
    }

    @Command
    fun scanMediaFile(invoke: Invoke) {
        try {
            val args = invoke.parseArgs(ScanMediaFileArgs::class.java)
            val path = args.path
            if (path == null) {
                invoke.reject("File path is required.")
                return
            }

            MediaScannerConnection.scanFile(
                activity,
                arrayOf(path),
                null
            ) { _, _ ->
                // Scan completed
                val ret = JSObject()
                ret.put("success", true)
                invoke.resolve(ret)
            }
        } catch (e: Exception) {
            android.util.Log.e("TilePlugin", "Scan media file failed", e)
            invoke.reject("Scan media file failed: " + e.message)
        }
    }



    private val tileClickReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action == DownloadTileService.ACTION_DOWNLOAD_TILE_CLICKED) {
                android.util.Log.d("DownloadTilePlugin", "剪贴板下载磁贴广播已接收!")
                val payload = JSObject()
                payload.put("timestamp", System.currentTimeMillis())
                trigger("clipboard_download", payload)
            } else if (intent.action == UploadTileService.ACTION_UPLOAD_TILE_CLICKED) {
                android.util.Log.d("UploadTilePlugin", "剪贴板上传磁贴广播已接收!")
                val payload = JSObject()
                payload.put("timestamp", System.currentTimeMillis())
                payload.put("tileName", intent.getStringExtra("tile_name") ?: "Unknown")
                payload.put("clickTime", intent.getLongExtra("click_time", 0))
                payload.put("message", intent.getStringExtra("message") ?: "No message")
                trigger("upload_tile_clicked", payload)
            }
        }
    }

    private fun register() {
        // 注册磁贴点击事件
        android.util.Log.d("TilePlugin", "正在注册磁贴广播接收器...")
        val filter = IntentFilter()
        filter.addAction(DownloadTileService.ACTION_DOWNLOAD_TILE_CLICKED)
        filter.addAction(UploadTileService.ACTION_UPLOAD_TILE_CLICKED)

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                activity.registerReceiver(tileClickReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
            } else {
                activity.registerReceiver(tileClickReceiver, filter)
            }
            android.util.Log.d("TilePlugin", "磁贴广播接收器注册成功，支持上传和下载磁贴")
        } catch (e: Exception) {
            android.util.Log.e("TilePlugin", "注册磁贴广播接收器失败", e)
        }
    }

    override fun load(webView: WebView) {
        super.load(webView)
        register()
    }

    override fun onPause() {
        super.onPause()
        try {
            activity.unregisterReceiver(tileClickReceiver)
            android.util.Log.d("TilePlugin", "磁贴广播接收器已注销")
        } catch (e: IllegalArgumentException) {
            // Can be safely ignored
        }
    }

    override fun onResume() {
        super.onResume()
        register()
    }
}
