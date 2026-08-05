package dev.mobilecodex

import android.app.Application

class MobileCodexApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        lateinit var instance: MobileCodexApplication
            private set
    }
}
