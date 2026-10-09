package com.kunektayo.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

/**
 * Foreground Service that preserves continuous microphone capture, WebRTC
 * peer connections, and audio streaming when KunekTayo runs in the background
 * or in Android Picture-in-Picture (PiP) mode.
 */
class CallNotificationService : Service() {

    companion object {
        const val CHANNEL_ID = "kunektayo_active_call"
        const val NOTIFICATION_ID = 2001
        const val ACTION_START = "ACTION_START_CALL"
        const val ACTION_STOP = "ACTION_STOP_CALL"

        fun start(context: Context) {
            try {
                val intent = Intent(context, CallNotificationService::class.java).apply {
                    action = ACTION_START
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        fun stop(context: Context) {
            try {
                val intent = Intent(context, CallNotificationService::class.java).apply {
                    action = ACTION_STOP
                }
                context.startService(intent)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    stopForeground(Service.STOP_FOREGROUND_REMOVE)
                } else {
                    @Suppress("DEPRECATION")
                    stopForeground(true)
                }
            } catch (_: Exception) {}
            stopSelf()
            return START_NOT_STICKY
        }

        // On Android 14+ (API 34+), starting a foreground service of type microphone
        // requires RECORD_AUDIO to already be granted. If the user is still on the permission
        // dialog or denied microphone, calling startForeground with microphone type will throw
        // SecurityException. If startForeground fails to attach a notification within 5 seconds
        // of startForegroundService(), Android kills the app with ForegroundServiceDidNotStartInTimeException.
        // Therefore, we MUST stopSelf() immediately if permission is missing, which cancels the timeout.
        val hasMicPermission = ContextCompat.checkSelfPermission(
            this,
            android.Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasMicPermission) {
            stopSelf()
            return START_NOT_STICKY
        }

        createNotificationChannel()

        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
        )

        val smallIconRes = if (applicationInfo.icon != 0) applicationInfo.icon else android.R.drawable.ic_menu_call

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("KunekTayo Call in Progress")
            .setContentText("Private 1-on-1 audio/video call active")
            .setSmallIcon(smallIconRes)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .build()

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE)
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            // CRITICAL: If startForeground throws SecurityException or fails, we MUST call stopSelf()
            // to cancel the system's 5-second pending FGS timeout and prevent the fatal
            // ForegroundServiceDidNotStartInTimeException crash.
            stopSelf()
            return START_NOT_STICKY
        }

        return START_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Active Call",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps audio and connection alive while KunekTayo is in the background or Picture-in-Picture"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }
}
