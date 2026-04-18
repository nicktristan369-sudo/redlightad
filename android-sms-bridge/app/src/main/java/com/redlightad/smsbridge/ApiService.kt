package com.redlightad.smsbridge

import android.util.Log
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

object ApiService {
    private const val TAG = "ApiService"
    
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val gson = Gson()
    private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

    // Send inbound SMS to server
    suspend fun sendInboundSms(
        fromNumber: String,
        message: String,
        timestamp: Long
    ): InboundResponse? = withContext(Dispatchers.IO) {
        try {
            val serverUrl = SMSBridgeApp.getServerUrl()
            val phoneId = SMSBridgeApp.getPhoneId()
            val apiKey = SMSBridgeApp.getApiKey()
            
            if (serverUrl.isEmpty() || phoneId.isEmpty()) {
                Log.e(TAG, "Missing server config")
                return@withContext null
            }

            val body = mapOf(
                "phone_id" to phoneId,
                "from_number" to fromNumber,
                "message" to message,
                "timestamp" to timestamp,
                "api_key" to apiKey
            )

            val request = Request.Builder()
                .url("$serverUrl/api/agency/sms/inbound")
                .post(gson.toJson(body).toRequestBody(jsonMediaType))
                .header("Content-Type", "application/json")
                .build()

            val response = client.newCall(request).execute()
            val responseBody = response.body?.string()
            
            if (response.isSuccessful && responseBody != null) {
                Log.d(TAG, "Inbound SMS sent successfully")
                return@withContext gson.fromJson(responseBody, InboundResponse::class.java)
            } else {
                Log.e(TAG, "Inbound SMS failed: ${response.code} - $responseBody")
                return@withContext null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Inbound SMS error", e)
            return@withContext null
        }
    }

    // Get pending outbound messages
    suspend fun getOutboundMessages(): List<OutboundMessage> = withContext(Dispatchers.IO) {
        try {
            val serverUrl = SMSBridgeApp.getServerUrl()
            val phoneId = SMSBridgeApp.getPhoneId()
            
            if (serverUrl.isEmpty() || phoneId.isEmpty()) {
                return@withContext emptyList()
            }

            val request = Request.Builder()
                .url("$serverUrl/api/agency/sms/outbound?phone_id=$phoneId")
                .get()
                .build()

            val response = client.newCall(request).execute()
            val responseBody = response.body?.string()
            
            if (response.isSuccessful && responseBody != null) {
                val result = gson.fromJson(responseBody, OutboundResponse::class.java)
                return@withContext result.messages ?: emptyList()
            }
            return@withContext emptyList()
        } catch (e: Exception) {
            Log.e(TAG, "Get outbound error", e)
            return@withContext emptyList()
        }
    }

    // Confirm message was sent
    suspend fun confirmSent(messageId: String, status: String = "sent"): Boolean = withContext(Dispatchers.IO) {
        try {
            val serverUrl = SMSBridgeApp.getServerUrl()
            
            val body = mapOf(
                "message_id" to messageId,
                "status" to status
            )

            val request = Request.Builder()
                .url("$serverUrl/api/agency/sms/sent")
                .post(gson.toJson(body).toRequestBody(jsonMediaType))
                .header("Content-Type", "application/json")
                .build()

            val response = client.newCall(request).execute()
            return@withContext response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "Confirm sent error", e)
            return@withContext false
        }
    }

    // Send heartbeat
    suspend fun sendHeartbeat(batteryLevel: Int): Boolean = withContext(Dispatchers.IO) {
        try {
            val serverUrl = SMSBridgeApp.getServerUrl()
            val phoneId = SMSBridgeApp.getPhoneId()
            
            if (serverUrl.isEmpty() || phoneId.isEmpty()) {
                return@withContext false
            }

            val body = mapOf(
                "phone_id" to phoneId,
                "battery_level" to batteryLevel,
                "is_online" to true
            )

            val request = Request.Builder()
                .url("$serverUrl/api/agency/phone/heartbeat")
                .post(gson.toJson(body).toRequestBody(jsonMediaType))
                .header("Content-Type", "application/json")
                .build()

            val response = client.newCall(request).execute()
            return@withContext response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "Heartbeat error", e)
            return@withContext false
        }
    }

    // Test connection
    suspend fun testConnection(serverUrl: String, phoneId: String, apiKey: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val body = mapOf(
                "phone_id" to phoneId,
                "is_online" to true,
                "api_key" to apiKey
            )

            val request = Request.Builder()
                .url("$serverUrl/api/agency/phone/heartbeat")
                .post(gson.toJson(body).toRequestBody(jsonMediaType))
                .header("Content-Type", "application/json")
                .build()

            val response = client.newCall(request).execute()
            return@withContext response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "Test connection error", e)
            return@withContext false
        }
    }
}

// Response classes
data class InboundResponse(
    val ok: Boolean,
    val conversation_id: String?,
    val ai_response: String?,
    val scheduled_send_at: String?,
    val keywords_matched: List<String>?
)

data class OutboundResponse(
    val messages: List<OutboundMessage>?
)

data class OutboundMessage(
    val id: String,
    val to_number: String,
    val message: String
)
