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
        private const val SMS_POLL_INTERVAL = 3_000L // 3 seconds - poll for new SMS
    }

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var heartbeatJob: Job? = null
    private var outboundJob: Job? = null
    private var smsPollJob: Job? = null
    private var smsObserver: SmsObserver? = null
    private var lastProcessedSmsId: Long = 0

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Service created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "Service started")
        
        startForeground(NOTIFICATION_ID, createNotification())
        startBackgroundTasks()
        
        // Register SMS Observer as backup for BroadcastReceiver
        // This works better on Samsung phones
        if (smsObserver == null) {
            smsObserver = SmsObserver(this)
            smsObserver?.register()
            Log.d(TAG, "SMS Observer registered")
        }
        
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "Service destroyed")
        
        // Unregister SMS Observer
        smsObserver?.unregister()
        smsObserver = null
        
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
        smsPollJob?.cancel()
        serviceScope.cancel()
    }

    private fun startBackgroundTasks() {
        // Start with ID 0 to process ALL recent SMS on first poll
        lastProcessedSmsId = 0
        Log.d(TAG, "Starting SMS polling - will process all recent messages")
        
        // Immediately send recent SMS to server
        serviceScope.launch {
            sendRecentSmsToServer()
        }
        
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
        
        // SMS polling task - checks for new SMS every 3 seconds
        smsPollJob = serviceScope.launch {
            while (isActive) {
                if (SMSBridgeApp.isConnected()) {
                    pollForNewSms()
                }
                delay(SMS_POLL_INTERVAL)
            }
        }
    }
    
    private fun pollForNewSms() {
        try {
            val cursor = contentResolver.query(
                android.provider.Telephony.Sms.Inbox.CONTENT_URI,
                arrayOf(
                    android.provider.Telephony.Sms._ID,
                    android.provider.Telephony.Sms.ADDRESS,
                    android.provider.Telephony.Sms.BODY,
                    android.provider.Telephony.Sms.DATE
                ),
                "${android.provider.Telephony.Sms._ID} > ?",
                arrayOf(lastProcessedSmsId.toString()),
                "${android.provider.Telephony.Sms._ID} ASC"
            )
            
            cursor?.use {
                while (it.moveToNext()) {
                    val id = it.getLong(it.getColumnIndexOrThrow(android.provider.Telephony.Sms._ID))
                    val sender = it.getString(it.getColumnIndexOrThrow(android.provider.Telephony.Sms.ADDRESS)) ?: continue
                    val body = it.getString(it.getColumnIndexOrThrow(android.provider.Telephony.Sms.BODY)) ?: continue
                    val date = it.getLong(it.getColumnIndexOrThrow(android.provider.Telephony.Sms.DATE))
                    
                    Log.d(TAG, "[POLL] New SMS found: ID=$id, From=$sender, Body=${body.take(30)}...")
                    
                    // Update last processed ID immediately
                    lastProcessedSmsId = id
                    
                    // Send to server
                    serviceScope.launch {
                        try {
                            val response = ApiService.sendInboundSms(
                                fromNumber = sender,
                                message = body,
                                timestamp = date
                            )
                            
                            if (response?.ok == true) {
                                Log.d(TAG, "[POLL] SMS forwarded successfully!")
                            } else {
                                Log.e(TAG, "[POLL] Failed to forward SMS")
                            }
                        } catch (e: Exception) {
                            Log.e(TAG, "[POLL] Error forwarding SMS", e)
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "[POLL] Error polling SMS", e)
        }
    }
    
    private fun getLatestSmsId(): Long {
        try {
            val cursor = contentResolver.query(
                android.provider.Telephony.Sms.Inbox.CONTENT_URI,
                arrayOf(android.provider.Telephony.Sms._ID),
                null,
                null,
                "${android.provider.Telephony.Sms._ID} DESC LIMIT 1"
            )
            
            cursor?.use {
                if (it.moveToFirst()) {
                    return it.getLong(it.getColumnIndexOrThrow(android.provider.Telephony.Sms._ID))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting latest SMS ID", e)
        }
        return 0
    }
    
    private suspend fun sendRecentSmsToServer() {
        try {
            Log.d(TAG, "[STARTUP] Sending recent SMS to server...")
            
            val cursor = contentResolver.query(
                android.provider.Telephony.Sms.Inbox.CONTENT_URI,
                arrayOf(
                    android.provider.Telephony.Sms._ID,
                    android.provider.Telephony.Sms.ADDRESS,
                    android.provider.Telephony.Sms.BODY,
                    android.provider.Telephony.Sms.DATE
                ),
                null,
                null,
                "${android.provider.Telephony.Sms.DATE} DESC LIMIT 10"
            )
            
            cursor?.use {
                var count = 0
                while (it.moveToNext()) {
                    val id = it.getLong(it.getColumnIndexOrThrow(android.provider.Telephony.Sms._ID))
                    val sender = it.getString(it.getColumnIndexOrThrow(android.provider.Telephony.Sms.ADDRESS)) ?: continue
                    val body = it.getString(it.getColumnIndexOrThrow(android.provider.Telephony.Sms.BODY)) ?: continue
                    val date = it.getLong(it.getColumnIndexOrThrow(android.provider.Telephony.Sms.DATE))
                    
                    Log.d(TAG, "[STARTUP] Found SMS: ID=$id, From=$sender, Body=${body.take(20)}...")
                    
                    // Update lastProcessedSmsId
                    if (id > lastProcessedSmsId) {
                        lastProcessedSmsId = id
                    }
                    
                    // Send to server
                    val response = ApiService.sendInboundSms(
                        fromNumber = sender,
                        message = body,
                        timestamp = date
                    )
                    
                    if (response?.ok == true) {
                        count++
                        Log.d(TAG, "[STARTUP] SMS sent to server successfully")
                    } else {
                        Log.e(TAG, "[STARTUP] Failed to send SMS to server")
                    }
                }
                Log.d(TAG, "[STARTUP] Sent $count SMS to server. lastProcessedSmsId=$lastProcessedSmsId")
            }
        } catch (e: Exception) {
            Log.e(TAG, "[STARTUP] Error sending recent SMS", e)
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
