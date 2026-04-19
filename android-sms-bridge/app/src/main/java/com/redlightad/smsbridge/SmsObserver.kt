package com.redlightad.smsbridge

import android.content.Context
import android.database.ContentObserver
import android.database.Cursor
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.provider.Telephony
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Alternative SMS detection using ContentObserver
 * This works on Samsung phones where BroadcastReceiver may be blocked
 */
class SmsObserver(
    private val context: Context,
    handler: Handler = Handler(Looper.getMainLooper())
) : ContentObserver(handler) {

    companion object {
        private const val TAG = "SmsObserver"
        private var lastProcessedId: Long = 0
    }

    init {
        // Initialize with the latest SMS ID to avoid processing old messages
        lastProcessedId = getLatestSmsId()
        Log.d(TAG, "Initialized with lastProcessedId: $lastProcessedId")
    }

    override fun onChange(selfChange: Boolean, uri: Uri?) {
        super.onChange(selfChange, uri)
        Log.d(TAG, "SMS content changed: $uri")
        
        if (!SMSBridgeApp.isConnected()) {
            Log.d(TAG, "Not connected, ignoring")
            return
        }
        
        checkForNewSms()
    }

    private fun checkForNewSms() {
        try {
            val cursor: Cursor? = context.contentResolver.query(
                Telephony.Sms.Inbox.CONTENT_URI,
                arrayOf(
                    Telephony.Sms._ID,
                    Telephony.Sms.ADDRESS,
                    Telephony.Sms.BODY,
                    Telephony.Sms.DATE,
                    Telephony.Sms.READ
                ),
                "${Telephony.Sms._ID} > ?",
                arrayOf(lastProcessedId.toString()),
                "${Telephony.Sms._ID} ASC"
            )

            cursor?.use {
                while (it.moveToNext()) {
                    val id = it.getLong(it.getColumnIndexOrThrow(Telephony.Sms._ID))
                    val sender = it.getString(it.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)) ?: continue
                    val body = it.getString(it.getColumnIndexOrThrow(Telephony.Sms.BODY)) ?: continue
                    val date = it.getLong(it.getColumnIndexOrThrow(Telephony.Sms.DATE))

                    Log.d(TAG, "New SMS detected: ID=$id, From=$sender, Body=${body.take(30)}...")
                    
                    // Update last processed ID
                    lastProcessedId = id
                    
                    // Send to server
                    CoroutineScope(Dispatchers.IO).launch {
                        try {
                            val response = ApiService.sendInboundSms(
                                fromNumber = sender,
                                message = body,
                                timestamp = date
                            )
                            
                            if (response?.ok == true) {
                                Log.d(TAG, "SMS forwarded to server successfully via Observer")
                            } else {
                                Log.e(TAG, "Failed to forward SMS via Observer")
                            }
                        } catch (e: Exception) {
                            Log.e(TAG, "Error forwarding SMS via Observer", e)
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error checking for new SMS", e)
        }
    }

    private fun getLatestSmsId(): Long {
        try {
            val cursor: Cursor? = context.contentResolver.query(
                Telephony.Sms.Inbox.CONTENT_URI,
                arrayOf(Telephony.Sms._ID),
                null,
                null,
                "${Telephony.Sms._ID} DESC LIMIT 1"
            )

            cursor?.use {
                if (it.moveToFirst()) {
                    return it.getLong(it.getColumnIndexOrThrow(Telephony.Sms._ID))
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error getting latest SMS ID", e)
        }
        return 0
    }

    fun register() {
        try {
            context.contentResolver.registerContentObserver(
                Telephony.Sms.CONTENT_URI,
                true,
                this
            )
            Log.d(TAG, "SmsObserver registered")
        } catch (e: Exception) {
            Log.e(TAG, "Error registering SmsObserver", e)
        }
    }

    fun unregister() {
        try {
            context.contentResolver.unregisterContentObserver(this)
            Log.d(TAG, "SmsObserver unregistered")
        } catch (e: Exception) {
            Log.e(TAG, "Error unregistering SmsObserver", e)
        }
    }
}
