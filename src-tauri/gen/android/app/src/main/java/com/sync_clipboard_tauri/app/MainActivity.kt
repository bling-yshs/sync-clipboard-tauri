package com.sync_clipboard_tauri.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import java.io.File
import org.json.JSONObject

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)

    // 检查是否从磁贴启动
    checkTileIntent(intent)
    checkDeepLinkFallback(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    checkTileIntent(intent)
    checkDeepLinkFallback(intent)
  }

  private fun checkTileIntent(intent: Intent) {
    // 检查是否从剪贴板上传磁贴启动
    if (intent.getBooleanExtra("from_upload_tile", false)) {
      android.util.Log.d("MainActivity", "检测到从剪贴板上传磁贴启动")
      val action = intent.getStringExtra("action")
      val tileName = intent.getStringExtra("tile_name")
      val clickTime = intent.getLongExtra("click_time", 0)

      android.util.Log.d("MainActivity", "动作: $action, 磁贴名称: $tileName, 点击时间: $clickTime")

      // 将参数存储到文件中，供前端读取
      try {
        val dataDir = filesDir
        val tileDataFile = File(dataDir, "upload_tile_data.json")

        val jsonData = JSONObject().apply {
          put("fromUploadTile", true)
          put("action", action ?: "")
          put("tileName", tileName ?: "")
          put("clickTime", clickTime)
          put("timestamp", System.currentTimeMillis())
        }

        tileDataFile.writeText(jsonData.toString())
        android.util.Log.d("MainActivity", "剪贴板上传磁贴数据已写入文件: ${tileDataFile.absolutePath}")
      } catch (e: Exception) {
        android.util.Log.e("MainActivity", "写入剪贴板上传磁贴数据文件失败", e)
      }
    }

    // 检查是否从剪贴板下载磁贴启动
    if (intent.getBooleanExtra("from_quick_tile", false)) {
      android.util.Log.d("MainActivity", "检测到从剪贴板下载磁贴启动")
      val action = intent.getStringExtra("action")
      val tileName = intent.getStringExtra("tile_name")
      val clickTime = intent.getLongExtra("click_time", 0)

      android.util.Log.d("MainActivity", "动作: $action, 磁贴名称: $tileName, 点击时间: $clickTime")

      // 将参数存储到文件中，供前端读取
      try {
        val dataDir = filesDir
        val tileDataFile = File(dataDir, "download_tile_data.json")

        val jsonData = JSONObject().apply {
          put("fromDownloadTile", true)
          put("action", action ?: "")
          put("tileName", tileName ?: "")
          put("clickTime", clickTime)
          put("timestamp", System.currentTimeMillis())
        }

        tileDataFile.writeText(jsonData.toString())
        android.util.Log.d("MainActivity", "剪贴板下载磁贴数据已写入文件: ${tileDataFile.absolutePath}")
      } catch (e: Exception) {
        android.util.Log.e("MainActivity", "写入剪贴板下载磁贴数据文件失败", e)
      }
    }
  }

  private fun checkDeepLinkFallback(intent: Intent) {
    // 检查是否是从磁贴的fallback方式启动
    if (intent.getBooleanExtra("from_tile", false)) {
      val deepLinkUrl = intent.getStringExtra("deep_link_url")
      val tileAction = intent.getStringExtra("tile_action")

      android.util.Log.d("MainActivity", "检测到磁贴fallback启动，URL: $deepLinkUrl, 动作: $tileAction")

      if (deepLinkUrl != null) {
        // 将deep link URL写入文件，供前端读取
        try {
          val dataDir = filesDir
          val deepLinkFile = File(dataDir, "deep_link_fallback.json")

          val jsonData = JSONObject().apply {
            put("url", deepLinkUrl)
            put("action", tileAction ?: "")
            put("timestamp", System.currentTimeMillis())
            put("fromTileFallback", true)
          }

          deepLinkFile.writeText(jsonData.toString())
          android.util.Log.d("MainActivity", "Deep link fallback数据已写入文件: ${deepLinkFile.absolutePath}")
        } catch (e: Exception) {
          android.util.Log.e("MainActivity", "写入deep link fallback数据失败", e)
        }
      }
    }
  }
}


