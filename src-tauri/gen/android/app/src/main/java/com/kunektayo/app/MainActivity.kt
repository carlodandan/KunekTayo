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
                CallNotificationService.start(this)
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

    private fun updatePipParams() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val builder = PictureInPictureParams.Builder()
                    .setAspectRatio(Rational(16, 9))

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    builder.setAutoEnterEnabled(isCallActive)
                }

                setPictureInPictureParams(builder.build())
            } catch (_: Exception) {}
        }
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        // If the user navigates away or taps home while in an active call, enter PiP
        if (isCallActive && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val params = PictureInPictureParams.Builder()
                    .setAspectRatio(Rational(16, 9))
                    .build()
                enterPictureInPictureMode(params)
            } catch (_: Exception) {}
        }
    }

    override fun onPause() {
        super.onPause()
        // If a call is active or the activity entered PiP, unpause the WebView so WebRTC
        // audio, microphone capture, video decoding, and network loops stay alive.
        if (isCallActive || (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && isInPictureInPictureMode)) {
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
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return try {
                val params = PictureInPictureParams.Builder()
                    .setAspectRatio(Rational(16, 9))
                    .build()
                activity.enterPictureInPictureMode(params)
            } catch (_: Exception) {
                false
            }
        }
        return false
    }

    @JavascriptInterface
    fun isSupported(): Boolean = true
}
