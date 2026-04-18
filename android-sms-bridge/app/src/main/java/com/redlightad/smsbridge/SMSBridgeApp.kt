package com.redlightad.smsbridge

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.SharedPreferences
import android.os.Build

class SMSBridgeApp : Application() {

    companion object {
        const val CHANNEL_ID = "sms_bridge_channel"
        const val PREFS_NAME = "sms_bridge_prefs"
        
        // Preference keys
        const val PREF_SERVER_URL = "server_url"
        const val PREF_PHONE_ID = "phone_id"
        const val PREF_API_KEY = "api_key"
        const val PREF_IS_CONNECTED = "is_connected"
        
        lateinit var instance: SMSBridgeApp
            private set
            
        fun getPrefs(): SharedPreferences {
            return instance.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        }
        
        fun getServerUrl(): String = getPrefs().getString(PREF_SERVER_URL, "") ?: ""
        fun getPhoneId(): String = getPrefs().getString(PREF_PHONE_ID, "") ?: ""
        fun getApiKey(): String = getPrefs().getString(PREF_API_KEY, "") ?: ""
        fun isConnected(): Boolean = getPrefs().getBoolean(PREF_IS_CONNECTED, false)
        
        fun saveConfig(serverUrl: String, phoneId: String, apiKey: String) {
            getPrefs().edit()
                .putString(PREF_SERVER_URL, serverUrl)
                .putString(PREF_PHONE_ID, phoneId)
                .putString(PREF_API_KEY, apiKey)
                .putBoolean(PREF_IS_CONNECTED, true)
                .apply()
        }
        
        fun clearConfig() {
            getPrefs().edit()
                .remove(PREF_SERVER_URL)
                .remove(PREF_PHONE_ID)
                .remove(PREF_API_KEY)
                .putBoolean(PREF_IS_CONNECTED, false)
                .apply()
        }
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SMS Bridge Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps SMS Bridge running in background"
                setShowBadge(false)
            }
            
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
}
