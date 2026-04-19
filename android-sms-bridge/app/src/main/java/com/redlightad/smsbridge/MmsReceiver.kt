package com.redlightad.smsbridge

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * MMS Receiver - Required for default SMS app registration
 * We don't actually handle MMS, but Android requires this component
 */
class MmsReceiver : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "MmsReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "MMS received - ignoring (SMS only)")
        // We don't handle MMS, just acknowledge receipt
    }
}
