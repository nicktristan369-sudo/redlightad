package com.redlightad.smsbridge

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*

class BridgeService : Service() {

    companion object {
        private const val TAG = "BridgeService"
        private const val NOTIFICATION_ID = 1001
        private const val HEARTBEAT_INTERVAL = 30_000L // 30 seconds
        private const val OUTBOUND_CHECK_INTERVAL = 5_000L // 5 seconds
    }

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var heartbeatJob: Job? = null
    private var outboundJob: Job? = null

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Service created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "Service started")
        
        startForeground(NOTIFICATION_ID, createNotification())
        startBackgroundTasks()
        
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "Service destroyed")
        
        // Notify server that phone is offline
        serviceScope.launch {
            try {
                // Could send offline notification here
            } catch (e: Exception) {
                Log.e(TAG, "Error notifying offline", e)
            }
        }
        
        heartbeatJob?.cancel()
        outboundJob?.cancel()
        serviceScope.cancel()
    }

    private fun startBackgroundTasks() {
        // Heartbeat task
        heartbeatJob = serviceScope.launch {
            while (isActive) {
                if (SMSBridgeApp.isConnected()) {
                    val batteryLevel = getBatteryLevel()
                    val success = ApiService.sendHeartbeat(batteryLevel)
                    Log.d(TAG, "Heartbeat sent: $success (battery: $batteryLevel%)")
                }
                delay(HEARTBEAT_INTERVAL)
            }
        }

        // Outbound messages task
        outboundJob = serviceScope.launch {
            while (isActive) {
                if (SMSBridgeApp.isConnected()) {
                    checkAndSendOutboundMessages()
                }
                delay(OUTBOUND_CHECK_INTERVAL)
            }
        }
    }

    private suspend fun checkAndSendOutboundMessages() {
        try {
            val messages = ApiService.getOutboundMessages()
            
            for (msg in messages) {
                Log.d(TAG, "Sending outbound SMS to ${msg.to_number}")
                
                val success = SmsSender.sendSms(
                    context = this@BridgeService,
                    phoneNumber = msg.to_number,
                    message = msg.message
                )
                
                // Confirm to server
                val status = if (success) "sent" else "failed"
                ApiService.confirmSent(msg.id, status)
                
                // Small delay between messages
                delay(500)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error checking outbound messages", e)
        }
    }

    private fun getBatteryLevel(): Int {
        val batteryIntent = registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        
        return if (level >= 0 && scale > 0) {
            (level * 100 / scale)
        } else {
            -1
        }
    }

    private fun createNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, SMSBridgeApp.CHANNEL_ID)
            .setContentTitle("SMS Bridge Active")
            .setContentText("Monitoring messages...")
            .setSmallIcon(android.R.drawable.ic_dialog_email)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
