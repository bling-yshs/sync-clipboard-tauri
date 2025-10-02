package com.plugin.quicktile

import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import androidx.annotation.RequiresApi


@RequiresApi(Build.VERSION_CODES.N)
class UploadTileService : TileService() {

    companion object {
        const val ACTION_UPLOAD_TILE_CLICKED = "com.plugin.quicktile.ACTION_UPLOAD_TILE_CLICKED"
    }

    override fun onTileAdded() {
        super.onTileAdded()
        updateTileState(Tile.STATE_INACTIVE)
    }

    override fun onStartListening() {
        super.onStartListening()
        updateTileState(Tile.STATE_INACTIVE)
    }

    override fun onClick() {
        super.onClick()

        android.util.Log.d("UploadTileService", "剪贴板上传磁贴被点击")

        // 使用 Deep Link 启动应用并跳转到上传页面
        val uri = Uri.parse("https://sync-clipboard-tauri.app/upload-clipboard?from=qs_tile&timestamp=${System.currentTimeMillis()}")
        val intent = Intent(Intent.ACTION_VIEW, uri)
            .setPackage(packageName)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or
                      Intent.FLAG_ACTIVITY_SINGLE_TOP or
                      Intent.FLAG_ACTIVITY_CLEAR_TOP or
                      Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)

        android.util.Log.d("UploadTileService", "创建Deep Link Intent: $uri")

        // 抽出真正的启动动作，便于和解锁逻辑复用
        fun launchNow() {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    // Android 14+：必须用 PendingIntent 的重载
                    val pi = PendingIntent.getActivity(
                        /* context = */ this,
                        /* requestCode = */ System.currentTimeMillis().toInt(), // 使用时间戳确保唯一性
                        /* intent = */ intent,
                        /* flags = */ PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                    )
                    startActivityAndCollapse(pi)  // 官方推荐方式（14+）
                } else {
                    @Suppress("DEPRECATION")
                    startActivityAndCollapse(intent)  // 13 及以下仍可用
                }
                android.util.Log.d("UploadTileService", "应用启动请求已通过startActivityAndCollapse发送")
            } catch (e: Exception) {
                android.util.Log.e("UploadTileService", "启动应用失败", e)
                // 如果deep link失败，尝试直接启动主Activity
                try {
                    val fallbackIntent = Intent().apply {
                        setClassName(packageName, "com.sync_clipboard_tauri.app.MainActivity")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or
                                Intent.FLAG_ACTIVITY_SINGLE_TOP or
                                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
                        putExtra("deep_link_url", uri.toString())
                        putExtra("from_tile", true)
                        putExtra("tile_action", "upload")
                    }

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                        val fallbackPi = PendingIntent.getActivity(
                            this,
                            System.currentTimeMillis().toInt(),
                            fallbackIntent,
                            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                        )
                        startActivityAndCollapse(fallbackPi)
                    } else {
                        @Suppress("DEPRECATION")
                        startActivityAndCollapse(fallbackIntent)
                    }
                    android.util.Log.d("UploadTileService", "使用fallback方式启动应用")
                } catch (fallbackError: Exception) {
                    android.util.Log.e("UploadTileService", "fallback启动也失败", fallbackError)
                }
            }
        }

        // 如果设备上锁，先请求解锁再执行启动；否则直接启动
        if (isLocked) {
            unlockAndRun { launchNow() }
        } else {
            launchNow()
        }

        // 可选：轻量反馈（若你需要）
        qsTile?.let { tile ->
            tile.state = Tile.STATE_ACTIVE
            tile.updateTile()
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                tile.state = Tile.STATE_INACTIVE
                tile.updateTile()
            }, 800)
        }
    }


    private fun updateTileState(state: Int) {
        qsTile?.let { tile ->
            tile.state = state
            when (state) {
                Tile.STATE_ACTIVE -> {
                    tile.label = "剪贴板上传 (激活)"
                    tile.contentDescription = "剪贴板上传已激活"
                }
                Tile.STATE_INACTIVE -> {
                    tile.label = "剪贴板上传"
                    tile.contentDescription = "点击剪贴板上传"
                }
            }
            tile.updateTile()
        }
    }
}
