package com.redlightad.smsbridge

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.telephony.SmsManager
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

object SmsSender {
    private const val TAG = "SmsSender"
    private const val SMS_SENT_ACTION = "com.redlightad.smsbridge.SMS_SENT"

    suspend fun sendSms(context: Context, phoneNumber: String, message: String): Boolean {
        return try {
            val smsManager = context.getSystemService(SmsManager::class.java)
            
            // Split message if too long
            val parts = smsManager.divideMessage(message)
            
            if (parts.size == 1) {
                // Single part SMS
                sendSingleSms(context, smsManager, phoneNumber, message)
            } else {
                // Multi-part SMS
                sendMultipartSms(context, smsManager, phoneNumber, parts)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error sending SMS to $phoneNumber", e)
            false
        }
    }

    private suspend fun sendSingleSms(
        context: Context,
        smsManager: SmsManager,
        phoneNumber: String,
        message: String
    ): Boolean = suspendCancellableCoroutine { continuation ->
        val sentIntent = PendingIntent.getBroadcast(
            context,
            0,
            Intent(SMS_SENT_ACTION),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val receiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context, intent: Intent) {
                context.unregisterReceiver(this)
                val success = resultCode == android.app.Activity.RESULT_OK
                Log.d(TAG, "SMS sent result: $success (code: $resultCode)")
                continuation.resume(success)
            }
        }

        context.registerReceiver(receiver, IntentFilter(SMS_SENT_ACTION), Context.RECEIVER_NOT_EXPORTED)

        try {
            smsManager.sendTextMessage(
                phoneNumber,
                null,
                message,
                sentIntent,
                null
            )
            Log.d(TAG, "SMS queued for sending to $phoneNumber")
        } catch (e: Exception) {
            context.unregisterReceiver(receiver)
            Log.e(TAG, "Failed to queue SMS", e)
            continuation.resume(false)
        }
    }

    private suspend fun sendMultipartSms(
        context: Context,
        smsManager: SmsManager,
        phoneNumber: String,
        parts: ArrayList<String>
    ): Boolean {
        return try {
            val sentIntents = ArrayList<PendingIntent>()
            
            for (i in parts.indices) {
                val intent = PendingIntent.getBroadcast(
                    context,
                    i,
                    Intent(SMS_SENT_ACTION).putExtra("part", i),
                    PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                )
                sentIntents.add(intent)
            }

            smsManager.sendMultipartTextMessage(
                phoneNumber,
                null,
                parts,
                sentIntents,
                null
            )
            
            Log.d(TAG, "Multipart SMS (${parts.size} parts) queued for $phoneNumber")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send multipart SMS", e)
            false
        }
    }
}
