package com.redlightad.smsbridge

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log

/**
 * Headless SMS Service - Required for default SMS app registration
 * Handles "respond via message" requests from incoming calls
 */
class HeadlessSmsService : Service() {
    
    companion object {
        private const val TAG = "HeadlessSmsService"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "Headless SMS service started - ignoring")
        stopSelf()
        return START_NOT_STICKY
    }
}
