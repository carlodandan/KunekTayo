package com.kunektayo.app

import android.app.PictureInPictureParams
import android.content.res.Configuration
import android.os.Build
import android.os.Bundle
import android.util.Rational
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge

class MainActivity : TauriActivity() {
    private var webView: WebView? = null
    var isCallActive: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        // Automatically enter PiP when user swipes back or taps the Back button during an active call
        onBackPressedDispatcher.addCallback(this, object : androidx.activity.OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (isCallActive && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                    packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
                    val entered = enterPipInternal()
                    if (entered) return
                    // If already in PiP or PiP couldn't be entered, keep call alive in background
                    moveTaskToBack(true)
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                    isEnabled = true
                }
            }
        })
    }

    override fun onWebViewCreate(webView: WebView) {
        super.onWebViewCreate(webView)
        this.webView = webView

        // Allow media to play automatically without blocking on user gestures
        webView.settings.mediaPlaybackRequiresUserGesture = false

        // Inject Javascript interface for call state synchronization
        webView.addJavascriptInterface(AndroidCallBridge(this), "AndroidCallBridge")
    }

    fun setCallState(active: Boolean) {
        isCallActive = active
        runOnUiThread {
            if (active) {
                val hasMicPerm = androidx.core.content.ContextCompat.checkSelfPermission(
                    this,
                    android.Manifest.permission.RECORD_AUDIO
                ) == android.content.pm.PackageManager.PERMISSION_GRANTED

                if (hasMicPerm) {
                    CallNotificationService.start(this)
                }
                updatePipParams()
            } else {
                CallNotificationService.stop(this)
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
        if (isCallActive) {
            val hasMicPerm = androidx.core.content.ContextCompat.checkSelfPermission(
                this,
                android.Manifest.permission.RECORD_AUDIO
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED

            if (hasMicPerm) {
                CallNotificationService.start(this)
            }
            updatePipParams()
        }
    }

    fun updatePipParams() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
            try {
                val isPortrait = resources.configuration.orientation == Configuration.ORIENTATION_PORTRAIT
                val ratio = if (isPortrait) Rational(9, 16) else Rational(16, 9)

                val builder = PictureInPictureParams.Builder()
                    .setAspectRatio(ratio)

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    builder.setAutoEnterEnabled(isCallActive)
                }

                setPictureInPictureParams(builder.build())
            } catch (_: Exception) {}
        }
    }

    fun enterPipInternal(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
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
        // Automatically enter Picture-in-Picture when user swipes up or presses Home button
        if (isCallActive && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
                if (!isFinishing && !isDestroyed && !isInPictureInPictureMode) {
                    enterPipInternal()
                }
            }
        }
    }

    override fun onPause() {
        super.onPause()
        // Only keep the WebView resumed if actively inside Picture-in-Picture mode so video renders.
        // Never force resume when hidden/minimized to background, which causes Chromium EGL/GPU crashes.
        // WebRTC background audio and peer connection are kept alive by CallNotificationService.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && isInPictureInPictureMode) {
            webView?.onResume()
        }
    }

    override fun onPictureInPictureModeChanged(
        isInPictureInPictureMode: Boolean,
        newConfig: Configuration
    ) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
        // Inform frontend so it can adapt into focused video-only layout
        webView?.post {
            webView?.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('android:pip-changed', { detail: { isPip: $isInPictureInPictureMode } }));",
                null
            )
        }
    }

    override fun onDestroy() {
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
            activity.packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
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
               activity.packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_PICTURE_IN_PICTURE)
    }
}
