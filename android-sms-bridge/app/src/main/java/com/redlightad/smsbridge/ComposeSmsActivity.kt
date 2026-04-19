package com.redlightad.smsbridge

import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity

/**
 * Compose SMS Activity - Required for default SMS app registration
 * Handles intents to compose new SMS messages
 */
class ComposeSmsActivity : AppCompatActivity() {
    
    companion object {
        private const val TAG = "ComposeSmsActivity"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        Log.d(TAG, "Compose SMS activity opened")
        
        // Get the recipient from intent data
        val data = intent.data
        val recipient = data?.schemeSpecificPart
        
        Log.d(TAG, "Recipient: $recipient")
        
        // For now, just open the main activity
        // In a full implementation, you'd show a compose UI
        val mainIntent = Intent(this, MainActivity::class.java)
        startActivity(mainIntent)
        
        finish()
    }
}
