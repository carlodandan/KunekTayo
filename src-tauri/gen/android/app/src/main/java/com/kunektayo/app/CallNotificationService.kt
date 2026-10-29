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

class CallNotificationService : Service() {

    companion object {
        const val CHANNEL_ID = "kunektayo_active_call"
        const val NOTIFICATION_ID = 2001
        const val ACTION_START = "ACTION_START_CALL"

        @Volatile
        var isRunning: Boolean = false
            private set

        fun start(context: Context) {
            try {
                val hasMicPermission = ContextCompat.checkSelfPermission(
                    context,
                    android.Manifest.permission.RECORD_AUDIO
                ) == PackageManager.PERMISSION_GRANTED

                if (!hasMicPermission) {
                    return
                }

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
            if (!isRunning) return
            try {
                context.stopService(Intent(context, CallNotificationService::class.java))
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        createNotificationChannel()
        val notification = buildNotification()

        val hasMicPermission = ContextCompat.checkSelfPermission(
            this,
            android.Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

        // Once startForegroundService() is called, Android REQUIRES startForeground()
        // before stopSelf() is called, or it crashes with ForegroundServiceDidNotStartInTimeException.
        var startedForeground = false
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                val fgsType = if (hasMicPermission) {
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
                } else {
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                }
                startForeground(NOTIFICATION_ID, notification, fgsType)
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
            startedForeground = true
            isRunning = true
        } catch (e: Exception) {
            e.printStackTrace()
            // Satisfy Android's startForeground requirement with mediaPlayback fallback before stopping
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    startForeground(
                        NOTIFICATION_ID,
                        notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                    )
                } else {
                    startForeground(NOTIFICATION_ID, notification)
                }
                startedForeground = true
            } catch (_: Exception) {}

            if (startedForeground) {
                stopForegroundCompat()
            }
            isRunning = false
            stopSelf()
            return START_NOT_STICKY
        }

        if (!hasMicPermission) {
            stopForegroundCompat()
            isRunning = false
            stopSelf()
            return START_NOT_STICKY
        }

        return START_STICKY
    }

    override fun onDestroy() {
        isRunning = false
        stopForegroundCompat()
        super.onDestroy()
    }

    private fun stopForegroundCompat() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(Service.STOP_FOREGROUND_REMOVE)
            } else {
                @Suppress("DEPRECATION")
                stopForeground(true)
            }
        } catch (_: Exception) {}
    }

    private fun buildNotification(): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
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

        val smallIconRes = if (applicationInfo.icon != 0) {
            applicationInfo.icon
        } else {
            android.R.drawable.ic_menu_call
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("KunekTayo Call in Progress")
            .setContentText("Private 1-on-1 audio/video call active")
            .setSmallIcon(smallIconRes)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .build()
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