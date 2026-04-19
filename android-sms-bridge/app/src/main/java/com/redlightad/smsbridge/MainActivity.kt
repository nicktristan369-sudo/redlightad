package com.redlightad.smsbridge

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.provider.Telephony
import android.view.View
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.*
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : AppCompatActivity() {

    companion object {
        private const val PERMISSION_REQUEST_CODE = 1001
        private val REQUIRED_PERMISSIONS = arrayOf(
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_SMS,
            Manifest.permission.SEND_SMS,
            Manifest.permission.READ_PHONE_STATE
        )
    }

    private val mainScope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    // Views
    private lateinit var statusCard: View
    private lateinit var statusIcon: ImageView
    private lateinit var statusText: TextView
    private lateinit var statusSubtext: TextView
    
    private lateinit var configCard: View
    private lateinit var serverUrlInput: EditText
    private lateinit var phoneIdInput: EditText
    private lateinit var apiKeyInput: EditText
    private lateinit var connectButton: Button
    private lateinit var disconnectButton: Button
    
    private lateinit var serviceToggle: Switch
    private lateinit var permissionStatus: TextView
    private lateinit var recentMessages: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        checkPermissions()
        updateUI()
    }

    override fun onResume() {
        super.onResume()
        updateUI()
        loadRecentMessages()
    }

    override fun onDestroy() {
        super.onDestroy()
        mainScope.cancel()
    }

    private fun initViews() {
        // Status card
        statusCard = findViewById(R.id.statusCard)
        statusIcon = findViewById(R.id.statusIcon)
        statusText = findViewById(R.id.statusText)
        statusSubtext = findViewById(R.id.statusSubtext)

        // Config card
        configCard = findViewById(R.id.configCard)
        serverUrlInput = findViewById(R.id.serverUrlInput)
        phoneIdInput = findViewById(R.id.phoneIdInput)
        apiKeyInput = findViewById(R.id.apiKeyInput)
        connectButton = findViewById(R.id.connectButton)
        disconnectButton = findViewById(R.id.disconnectButton)

        // Service toggle
        serviceToggle = findViewById(R.id.serviceToggle)
        permissionStatus = findViewById(R.id.permissionStatus)

        // Button listeners
        connectButton.setOnClickListener { connect() }
        disconnectButton.setOnClickListener { disconnect() }
        
        serviceToggle.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked) {
                startBridgeService()
            } else {
                stopBridgeService()
            }
        }

        // Permission button
        findViewById<Button>(R.id.permissionButton).setOnClickListener {
            requestAllPermissions()
        }

        // Battery optimization button
        findViewById<Button>(R.id.batteryButton).setOnClickListener {
            requestBatteryOptimization()
        }

        // Recent messages
        recentMessages = findViewById(R.id.recentMessages)
        
        // View messages button - open default SMS app
        findViewById<Button>(R.id.viewMessagesButton).setOnClickListener {
            openSmsInbox()
        }
        
        // Load recent messages
        loadRecentMessages()
    }
    
    private fun loadRecentMessages() {
        if (!hasAllPermissions()) {
            recentMessages.text = "Grant SMS permission to see messages"
            return
        }
        
        try {
            val cursor: Cursor? = contentResolver.query(
                Telephony.Sms.Inbox.CONTENT_URI,
                arrayOf(
                    Telephony.Sms.ADDRESS,
                    Telephony.Sms.BODY,
                    Telephony.Sms.DATE
                ),
                null,
                null,
                "${Telephony.Sms.DATE} DESC LIMIT 5"
            )
            
            val messages = StringBuilder()
            val dateFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
            
            cursor?.use {
                while (it.moveToNext()) {
                    val address = it.getString(it.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)) ?: "Unknown"
                    val body = it.getString(it.getColumnIndexOrThrow(Telephony.Sms.BODY)) ?: ""
                    val date = it.getLong(it.getColumnIndexOrThrow(Telephony.Sms.DATE))
                    val time = dateFormat.format(Date(date))
                    
                    val preview = if (body.length > 40) body.take(40) + "..." else body
                    messages.append("$time | $address\n$preview\n\n")
                }
            }
            
            recentMessages.text = if (messages.isNotEmpty()) {
                messages.toString().trim()
            } else {
                "No messages yet"
            }
        } catch (e: Exception) {
            recentMessages.text = "Error loading messages: ${e.message}"
        }
    }
    
    private fun openSmsInbox() {
        // Open the default SMS app
        val intent = Intent(Intent.ACTION_MAIN)
        intent.addCategory(Intent.CATEGORY_APP_MESSAGING)
        try {
            startActivity(intent)
        } catch (e: Exception) {
            // Fallback to SMS content URI
            val smsIntent = Intent(Intent.ACTION_VIEW)
            smsIntent.data = Uri.parse("content://sms/inbox")
            startActivity(smsIntent)
        }
    }

    private fun updateUI() {
        val isConnected = SMSBridgeApp.isConnected()
        val hasPermissions = hasAllPermissions()
        val isServiceRunning = isServiceRunning()

        // Status card
        if (isConnected && isServiceRunning) {
            statusIcon.setImageResource(android.R.drawable.presence_online)
            statusText.text = "Connected & Active"
            statusSubtext.text = "SMS Bridge is running"
            statusCard.setBackgroundColor(0xFF1B5E20.toInt())
        } else if (isConnected) {
            statusIcon.setImageResource(android.R.drawable.presence_away)
            statusText.text = "Connected"
            statusSubtext.text = "Start the service to begin"
            statusCard.setBackgroundColor(0xFFE65100.toInt())
        } else {
            statusIcon.setImageResource(android.R.drawable.presence_offline)
            statusText.text = "Not Connected"
            statusSubtext.text = "Enter server details below"
            statusCard.setBackgroundColor(0xFFB71C1C.toInt())
        }

        // Config card
        if (isConnected) {
            serverUrlInput.setText(SMSBridgeApp.getServerUrl())
            phoneIdInput.setText(SMSBridgeApp.getPhoneId())
            apiKeyInput.setText("••••••••")
            
            serverUrlInput.isEnabled = false
            phoneIdInput.isEnabled = false
            apiKeyInput.isEnabled = false
            
            connectButton.visibility = View.GONE
            disconnectButton.visibility = View.VISIBLE
        } else {
            serverUrlInput.setText("https://redlightad.com")
            phoneIdInput.setText("")
            apiKeyInput.setText("")
            
            serverUrlInput.isEnabled = true
            phoneIdInput.isEnabled = true
            apiKeyInput.isEnabled = true
            
            connectButton.visibility = View.VISIBLE
            disconnectButton.visibility = View.GONE
        }

        // Service toggle
        serviceToggle.isChecked = isServiceRunning
        serviceToggle.isEnabled = isConnected && hasPermissions

        // Permission status
        permissionStatus.text = if (hasPermissions) {
            "✓ All permissions granted"
        } else {
            "⚠ Some permissions missing"
        }
        permissionStatus.setTextColor(if (hasPermissions) 0xFF4CAF50.toInt() else 0xFFFF9800.toInt())
    }

    private fun connect() {
        val serverUrl = serverUrlInput.text.toString().trim().trimEnd('/')
        val phoneId = phoneIdInput.text.toString().trim()
        val apiKey = apiKeyInput.text.toString().trim()

        if (serverUrl.isEmpty() || phoneId.isEmpty()) {
            Toast.makeText(this, "Please enter server URL and Phone ID", Toast.LENGTH_SHORT).show()
            return
        }

        connectButton.isEnabled = false
        connectButton.text = "Connecting..."

        mainScope.launch {
            try {
                val success = ApiService.testConnection(serverUrl, phoneId, apiKey)
                
                if (success) {
                    SMSBridgeApp.saveConfig(serverUrl, phoneId, apiKey)
                    Toast.makeText(this@MainActivity, "Connected successfully!", Toast.LENGTH_SHORT).show()
                    
                    if (hasAllPermissions()) {
                        startBridgeService()
                    }
                } else {
                    Toast.makeText(this@MainActivity, "Connection failed. Check your details.", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Error: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                connectButton.isEnabled = true
                connectButton.text = "Connect"
                updateUI()
            }
        }
    }

    private fun disconnect() {
        AlertDialog.Builder(this)
            .setTitle("Disconnect?")
            .setMessage("This will stop the SMS Bridge service.")
            .setPositiveButton("Disconnect") { _, _ ->
                stopBridgeService()
                SMSBridgeApp.clearConfig()
                updateUI()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun startBridgeService() {
        val intent = Intent(this, BridgeService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        updateUI()
    }

    private fun stopBridgeService() {
        stopService(Intent(this, BridgeService::class.java))
        updateUI()
    }

    private fun isServiceRunning(): Boolean {
        val manager = getSystemService(ACTIVITY_SERVICE) as android.app.ActivityManager
        for (service in manager.getRunningServices(Int.MAX_VALUE)) {
            if (BridgeService::class.java.name == service.service.className) {
                return true
            }
        }
        return false
    }

    // Permissions
    private fun hasAllPermissions(): Boolean {
        return REQUIRED_PERMISSIONS.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun checkPermissions() {
        if (!hasAllPermissions()) {
            requestAllPermissions()
        }
    }

    private fun requestAllPermissions() {
        ActivityCompat.requestPermissions(this, REQUIRED_PERMISSIONS, PERMISSION_REQUEST_CODE)
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            updateUI()
            
            if (!hasAllPermissions()) {
                Toast.makeText(this, "SMS permissions are required for the app to work", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun requestBatteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = getSystemService(POWER_SERVICE) as PowerManager
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                }
                startActivity(intent)
            } else {
                Toast.makeText(this, "Battery optimization already disabled", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
