package com.kunektayo.app

import android.Manifest
import android.app.PictureInPictureParams
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Rational
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : TauriActivity() {
    private var webView: WebView? = null
    @Volatile
    var isCallActive: Boolean = false
    private var isRequestingPermissions: Boolean = false
    private var pendingWebViewPermissionRequest: PermissionRequest? = null
    private var audioDeviceCallback: AudioDeviceCallback? = null

    companion object {
        private const val PERMISSION_REQUEST_CODE = 1001
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        // Request Camera, Microphone, and Notification permissions upfront on launch
        ensureRuntimePermissions()
        registerAudioDeviceCallback()

        onBackPressedDispatcher.addCallback(this, object : androidx.activity.OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (isCallActive && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                    packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
                    val entered = enterPipInternal()
                    if (entered) return
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                    isEnabled = true
                }
            }
        })
    }

    private fun ensureRuntimePermissions() {
        val needed = mutableListOf<String>()
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.CAMERA)
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.RECORD_AUDIO)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.BLUETOOTH_CONNECT)
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        if (needed.isNotEmpty()) {
            isRequestingPermissions = true
            ActivityCompat.requestPermissions(this, needed.toTypedArray(), PERMISSION_REQUEST_CODE)
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            isRequestingPermissions = false

            pendingWebViewPermissionRequest?.let { req ->
                pendingWebViewPermissionRequest = null
                runOnUiThread {
                    try {
                        req.grant(req.resources)
                    } catch (_: Exception) {}
                }
            }

            if (isCallActive) {
                setCallState(true)
            }
        }
    }

    override fun onWebViewCreate(webView: WebView) {
        super.onWebViewCreate(webView)
        this.webView = webView

        // Allow media to play automatically without blocking on user gestures
        webView.settings.mediaPlaybackRequiresUserGesture = false

        // Inject Javascript interface for call state synchronization
        webView.addJavascriptInterface(AndroidCallBridge(this), "AndroidCallBridge")

        val defaultClient = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            webView.webChromeClient
        } else {
            null
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    val hasCam = ContextCompat.checkSelfPermission(
                        this@MainActivity,
                        Manifest.permission.CAMERA
                    ) == PackageManager.PERMISSION_GRANTED
                    val hasMic = ContextCompat.checkSelfPermission(
                        this@MainActivity,
                        Manifest.permission.RECORD_AUDIO
                    ) == PackageManager.PERMISSION_GRANTED

                    if (hasCam && hasMic) {
                        try {
                            request.grant(request.resources)
                        } catch (_: Exception) {}
                    } else {
                        pendingWebViewPermissionRequest = request
                        ensureRuntimePermissions()
                    }
                }
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                return defaultClient?.onShowFileChooser(webView, filePathCallback, fileChooserParams)
                    ?: super.onShowFileChooser(webView, filePathCallback, fileChooserParams)
            }
        }
    }

    private fun registerAudioDeviceCallback() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && audioDeviceCallback == null) {
            val audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
            val callback = object : AudioDeviceCallback() {
                override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>?) {
                    if (isCallActive) {
                        runOnUiThread { configureCallAudio(true) }
                    }
                }

                override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>?) {
                    if (isCallActive) {
                        runOnUiThread { configureCallAudio(true) }
                    }
                }
            }
            audioManager.registerAudioDeviceCallback(callback, null)
            audioDeviceCallback = callback
        }
    }

    private fun unregisterAudioDeviceCallback() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && audioDeviceCallback != null) {
            val audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
            audioDeviceCallback?.let {
                audioManager.unregisterAudioDeviceCallback(it)
            }
            audioDeviceCallback = null
        }
    }

    private fun configureCallAudio(active: Boolean) {
        try {
            val audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
            if (active) {
                audioManager.mode = AudioManager.MODE_IN_COMMUNICATION

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val devices = audioManager.availableCommunicationDevices
                    // Priority order:
                    // 1. Bluetooth headset / BLE headset / Bluetooth SCO
                    // 2. Wired headset / wired headphones / USB headset
                    // 3. Built-in speaker (speakerphone)
                    val btDevice = devices.firstOrNull {
                        it.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO ||
                        it.type == AudioDeviceInfo.TYPE_BLE_HEADSET ||
                        it.type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP
                    }
                    val wiredDevice = devices.firstOrNull {
                        it.type == AudioDeviceInfo.TYPE_WIRED_HEADSET ||
                        it.type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES ||
                        (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && it.type == AudioDeviceInfo.TYPE_USB_HEADSET)
                    }
                    val speakerDevice = devices.firstOrNull {
                        it.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER
                    }

                    val target = btDevice ?: wiredDevice ?: speakerDevice
                    if (target != null) {
                        audioManager.setCommunicationDevice(target)
                    }
                } else {
                    val hasBluetooth = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        val devices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
                        devices.any {
                            it.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO ||
                            it.type == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP
                        }
                    } else {
                        @Suppress("DEPRECATION")
                        audioManager.isBluetoothA2dpOn || audioManager.isBluetoothScoAvailableOffCall
                    }

                    val hasWiredHeadset = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        val devices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
                        devices.any {
                            it.type == AudioDeviceInfo.TYPE_WIRED_HEADSET ||
                            it.type == AudioDeviceInfo.TYPE_WIRED_HEADPHONES ||
                            (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && it.type == AudioDeviceInfo.TYPE_USB_HEADSET)
                        }
                    } else {
                        @Suppress("DEPRECATION")
                        audioManager.isWiredHeadsetOn
                    }

                    if (hasBluetooth) {
                        @Suppress("DEPRECATION")
                        audioManager.startBluetoothSco()
                        @Suppress("DEPRECATION")
                        audioManager.isBluetoothScoOn = true
                        @Suppress("DEPRECATION")
                        audioManager.isSpeakerphoneOn = false
                    } else if (hasWiredHeadset) {
                        @Suppress("DEPRECATION")
                        if (audioManager.isBluetoothScoOn) {
                            audioManager.isBluetoothScoOn = false
                            audioManager.stopBluetoothSco()
                        }
                        @Suppress("DEPRECATION")
                        audioManager.isSpeakerphoneOn = false
                    } else {
                        @Suppress("DEPRECATION")
                        if (audioManager.isBluetoothScoOn) {
                            audioManager.isBluetoothScoOn = false
                            audioManager.stopBluetoothSco()
                        }
                        @Suppress("DEPRECATION")
                        audioManager.isSpeakerphoneOn = true
                    }
                }
            } else {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    audioManager.clearCommunicationDevice()
                } else {
                    @Suppress("DEPRECATION")
                    if (audioManager.isBluetoothScoOn) {
                        audioManager.isBluetoothScoOn = false
                        audioManager.stopBluetoothSco()
                    }
                    @Suppress("DEPRECATION")
                    audioManager.isSpeakerphoneOn = false
                }
                audioManager.mode = AudioManager.MODE_NORMAL
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun setCallState(active: Boolean) {
        val changed = (isCallActive != active)
        isCallActive = active
        runOnUiThread {
            configureCallAudio(active)
            if (active) {
                val hasMicPerm = ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.RECORD_AUDIO
                ) == PackageManager.PERMISSION_GRANTED

                if (hasMicPerm && !isRequestingPermissions) {
                    CallNotificationService.start(this)
                }
                updatePipParams()
            } else {
                if (changed || CallNotificationService.isRunning) {
                    CallNotificationService.stop(this)
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    try {
                        val params = PictureInPictureParams.Builder()
                            .setAutoEnterEnabled(false)
                            .build()
                        setPictureInPictureParams(params)
                    } catch (_: Exception) {}
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        isRequestingPermissions = false
        if (isCallActive) {
            val hasMicPerm = ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.RECORD_AUDIO
            ) == PackageManager.PERMISSION_GRANTED

            if (hasMicPerm && !CallNotificationService.isRunning) {
                CallNotificationService.start(this)
            }
            updatePipParams()
        }
    }

    fun updatePipParams() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
            try {
                val isPortrait = resources.configuration.orientation == Configuration.ORIENTATION_PORTRAIT
                val ratio = if (isPortrait) Rational(9, 16) else Rational(16, 9)

                val builder = PictureInPictureParams.Builder()
                    .setAspectRatio(ratio)

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    builder.setAutoEnterEnabled(isCallActive && !isRequestingPermissions)
                }

                setPictureInPictureParams(builder.build())
            } catch (_: Exception) {}
        }
    }

    fun enterPipInternal(): Boolean {
        if (isRequestingPermissions) return false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
            if (isFinishing || isDestroyed || isInPictureInPictureMode) {
                return false
            }
            return try {
                val isPortrait = resources.configuration.orientation == Configuration.ORIENTATION_PORTRAIT
                val ratio = if (isPortrait) Rational(9, 16) else Rational(16, 9)
                val builder = PictureInPictureParams.Builder()
                    .setAspectRatio(ratio)

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    builder.setAutoEnterEnabled(isCallActive)
                }

                enterPictureInPictureMode(builder.build())
            } catch (_: Exception) {
                false
            }
        }
        return false
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        if (isCallActive && !isRequestingPermissions && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
                if (!isFinishing && !isDestroyed && !isInPictureInPictureMode) {
                    enterPipInternal()
                }
            }
        }
    }

    override fun onPause() {
        super.onPause()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && isInPictureInPictureMode) {
            webView?.onResume()
        }
    }

    override fun onPictureInPictureModeChanged(
        isInPictureInPictureMode: Boolean,
        newConfig: Configuration
    ) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
        webView?.post {
            webView?.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('android:pip-changed', { detail: { isPip: $isInPictureInPictureMode } }));",
                null
            )
        }
    }

    override fun onDestroy() {
        unregisterAudioDeviceCallback()
        configureCallAudio(false)
        CallNotificationService.stop(this)
        super.onDestroy()
    }
}

class AndroidCallBridge(private val activity: MainActivity) {
    @JavascriptInterface
    fun setCallActive(active: Boolean) {
        activity.setCallState(active)
    }

    @JavascriptInterface
    fun enterPip(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            activity.packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
            val future = java.util.concurrent.CompletableFuture<Boolean>()
            activity.runOnUiThread {
                future.complete(activity.enterPipInternal())
            }
            return try {
                future.get(1, java.util.concurrent.TimeUnit.SECONDS)
            } catch (_: Exception) {
                false
            }
        }
        return false
    }

    @JavascriptInterface
    fun isSupported(): Boolean {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
               activity.packageManager.hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)
    }
}