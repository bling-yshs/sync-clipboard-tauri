package app.tauri.sharetarget

import android.util.Log

class ShareTarget {
    fun pong(value: String): String {
        Log.i("Pong", value)
        return "from sharetarget"
    }
}
