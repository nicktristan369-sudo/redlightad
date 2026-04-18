package com.redlightad.smsbridge

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class SmsReceiver : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "SmsReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            return
        }

        // Check if connected
        if (!SMSBridgeApp.isConnected()) {
            Log.d(TAG, "Not connected, ignoring SMS")
            return
        }

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) {
            return
        }

        // Group messages by sender (multi-part SMS)
        val groupedMessages = mutableMapOf<String, StringBuilder>()
        var timestamp = System.currentTimeMillis()

        for (sms in messages) {
            val sender = sms.displayOriginatingAddress ?: continue
            val body = sms.messageBody ?: continue
            timestamp = sms.timestampMillis

            groupedMessages.getOrPut(sender) { StringBuilder() }.append(body)
        }

        // Process each complete message
        for ((sender, messageBuilder) in groupedMessages) {
            val message = messageBuilder.toString()
            Log.d(TAG, "Received SMS from $sender: ${message.take(50)}...")

            // Send to server in background
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val response = ApiService.sendInboundSms(
                        fromNumber = sender,
                        message = message,
                        timestamp = timestamp
                    )

                    if (response?.ok == true) {
                        Log.d(TAG, "SMS forwarded to server successfully")
                        
                        // If AI response is scheduled, the BridgeService will pick it up
                        if (response.keywords_matched?.isNotEmpty() == true) {
                            Log.d(TAG, "Keywords matched: ${response.keywords_matched}")
                        }
                    } else {
                        Log.e(TAG, "Failed to forward SMS to server")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error forwarding SMS", e)
                }
            }
        }
    }
}
