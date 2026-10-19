import type { BuildConfig, GeneratedFile } from './types.ts';

/**
 * Escapes strings for XML attributes and text nodes
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Escapes strings for Kotlin string literals
 */
function escapeKotlin(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$');
}

/**
 * Generates all files needed for a complete, production-ready Android Studio project.
 */
export function generateAndroidProject(config: BuildConfig): {
  files: GeneratedFile[];
  previews: Record<string, string>;
  workflow: string;
  readme: string;
} {
  const files: GeneratedFile[] = [];
  const packageDir = config.packageName.replace(/\./g, '/');

  // Parse host from URL for deep link intent filters and network config
  let host = 'example.com';
  try {
    host = new URL(config.url).hostname;
  } catch {
    // fallback
  }

  // 1. root settings.gradle.kts
  const settingsGradle = `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "${escapeKotlin(config.appName.replace(/[^a-zA-Z0-9_-]/g, ''))}"
include(":app")
`;
  files.push({ path: 'settings.gradle.kts', content: settingsGradle });

  // 2. root build.gradle.kts
  const rootBuildGradle = `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
}
`;
  files.push({ path: 'build.gradle.kts', content: rootBuildGradle });

  // 3. gradle.properties
  const gradleProperties = `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
`;
  files.push({ path: 'gradle.properties', content: gradleProperties });

  // 4. gradle/libs.versions.toml
  const versionCatalog = `[versions]
agp = "8.5.2"
kotlin = "2.0.0"
coreKtx = "1.13.1"
appcompat = "1.7.0"
material = "1.12.0"
swiperefreshlayout = "1.1.0"
webkit = "1.11.0"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-appcompat = { group = "androidx.appcompat", name = "appcompat", version.ref = "appcompat" }
material = { group = "com.google.android.material", name = "material", version.ref = "material" }
androidx-swiperefreshlayout = { group = "androidx.swiperefreshlayout", name = "swiperefreshlayout", version.ref = "swiperefreshlayout" }
androidx-webkit = { group = "androidx.webkit", name = "webkit", version.ref = "webkit" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
`;
  files.push({ path: 'gradle/libs.versions.toml', content: versionCatalog });

  // 5. gradle wrapper properties
  const gradleWrapperProperties = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;
  files.push({ path: 'gradle/wrapper/gradle-wrapper.properties', content: gradleWrapperProperties });

  // 6. gradlew executable scripts
  const gradlewSh = `#!/bin/sh
# Gradle start up script for POSIX systems
exec "\${0%/*}/gradle/wrapper/gradle-wrapper.jar" "$@" 2>/dev/null || gradle "$@"
`;
  files.push({ path: 'gradlew', content: gradlewSh });

  const gradlewBat = `@rem Gradle start up script for Windows
@if "%DEBUG%"=="" @echo off
gradle %*
`;
  files.push({ path: 'gradlew.bat', content: gradlewBat });

  // 7. app/build.gradle.kts
  const appBuildGradle = `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "${escapeKotlin(config.packageName)}"
    compileSdk = 35

    defaultConfig {
        applicationId = "${escapeKotlin(config.packageName)}"
        minSdk = 24
        targetSdk = 35
        versionCode = ${config.versionCode || 1}
        versionName = "${escapeKotlin(config.versionName || '1.0.0')}"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    signingConfigs {
        create("release") {
            // Uses generated debug keystore by default; replace with your upload keystore in CI/local
            storeFile = file("keystore/debug.keystore")
            storePassword = "androiddebugkey"
            keyAlias = "androiddebugkey"
            keyPassword = "androiddebugkey"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.webkit)
    ${config.enablePullToRefresh ? 'implementation(libs.androidx.swiperefreshlayout)' : '// SwipeRefreshLayout disabled'}
}
`;
  files.push({ path: 'app/build.gradle.kts', content: appBuildGradle });

  // 8. app/proguard-rules.pro
  const proguardRules = `# ProGuard rules for URL2APK WebView Wrapper
-keepattributes *Annotation*
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class android.webkit.** { *; }
-keep class androidx.webkit.** { *; }
-dontwarn android.webkit.**
`;
  files.push({ path: 'app/proguard-rules.pro', content: proguardRules });

  // 9. AndroidManifest.xml
  const orientationAttr =
    config.orientation === 'portrait' ? 'android:screenOrientation="portrait"' :
    config.orientation === 'landscape' ? 'android:screenOrientation="landscape"' :
    config.orientation === 'sensorPortrait' ? 'android:screenOrientation="sensorPortrait"' :
    '';

  const cleartextAttr = config.allowCleartext ? 'android:usesCleartextTraffic="true"' : 'android:usesCleartextTraffic="false"';

  const androidManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Essential permissions for WebView internet loading -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Storage permission for file downloads on older Android versions -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="28" />

    ${config.enableGeolocation ? '<!-- Geolocation permissions -->\n    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />\n    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />' : ''}
    ${config.enableCamera ? '<!-- Camera permission for HTML5 video/file input capture -->\n    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-feature android:name="android.hardware.camera" android:required="false" />' : ''}

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:hardwareAccelerated="true"
        android:networkSecurityConfig="@xml/network_security_config"
        ${cleartextAttr}
        android:theme="@style/Theme.URL2APK">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            ${orientationAttr}
            android:configChanges="orientation|screenSize|screenLayout|smallestScreenSize|uiMode"
            android:windowSoftInputMode="adjustResize">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            ${config.enableDeepLinks ? `<!-- Deep Link App Filter for ${escapeXml(host)} -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="${escapeXml(host)}" />
                ${config.allowCleartext ? `<data android:scheme="http" android:host="${escapeXml(host)}" />` : ''}
            </intent-filter>` : ''}
        </activity>

        ${config.allowFileAccess ? `<!-- FileProvider for secure file sharing (<input type="file">) -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${escapeXml(config.packageName)}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>` : ''}

    </application>

</manifest>
`;
  files.push({ path: 'app/src/main/AndroidManifest.xml', content: androidManifest });

  // 10. XML configs: network_security_config.xml and file_paths.xml
  const networkSecurityConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="${config.allowCleartext ? 'true' : 'false'}">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
    ${config.allowCleartext ? `
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">${escapeXml(host)}</domain>
    </domain-config>` : ''}
</network-security-config>
`;
  files.push({ path: 'app/src/main/res/xml/network_security_config.xml', content: networkSecurityConfig });

  const filePathsXml = `<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-files-path name="my_images" path="Pictures" />
    <external-cache-path name="my_cache" path="." />
    <cache-path name="internal_cache" path="." />
</paths>
`;
  files.push({ path: 'app/src/main/res/xml/file_paths.xml', content: filePathsXml });

  // 11. Resources: strings.xml, colors.xml, themes.xml
  const stringsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${escapeXml(config.appName)}</string>
    <string name="website_url">${escapeXml(config.url)}</string>
    <string name="error_offline_title">No Internet Connection</string>
    <string name="error_offline_message">Please check your network settings and try again.</string>
    <string name="action_retry">Retry</string>
    <string name="ssl_warning_title">Security Certificate Warning</string>
    <string name="ssl_warning_message">The security certificate of this site is not trusted. Continuing may compromise your privacy.</string>
    <string name="action_continue">Continue Anyway</string>
    <string name="action_go_back">Go Back</string>
    <string name="downloading_file">Downloading file…</string>
</resources>
`;
  files.push({ path: 'app/src/main/res/values/strings.xml', content: stringsXml });

  const colorsXml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="primary_color">${escapeXml(config.primaryColor || '#4F46E5')}</color>
    <color name="status_bar_color">${escapeXml(config.statusBarColor || '#312E81')}</color>
    <color name="splash_color">${escapeXml(config.splashColor || '#0F172A')}</color>
    <color name="white">#FFFFFFFF</color>
    <color name="black">#FF000000</color>
</resources>
`;
  files.push({ path: 'app/src/main/res/values/colors.xml', content: colorsXml });

  const themesXml = `<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.URL2APK" parent="Theme.Material3.DayNight.NoActionBar">
        <item name="colorPrimary">@color/primary_color</item>
        <item name="android:statusBarColor">@color/status_bar_color</item>
        <item name="android:navigationBarColor">@color/black</item>
        ${config.isFullScreen ? '<item name="android:windowFullscreen">true</item>' : ''}
        <item name="android:windowLightStatusBar">false</item>
    </style>
</resources>
`;
  files.push({ path: 'app/src/main/res/values/themes.xml', content: themesXml });

  // 12. Layouts: activity_main.xml
  const activityMainLayout = `<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@color/black">

    ${config.enablePullToRefresh ? `
    <androidx.swiperefreshlayout.widget.SwipeRefreshLayout
        android:id="@+id/swipeRefreshLayout"
        android:layout_width="match_parent"
        android:layout_height="match_parent">

        <WebView
            android:id="@+id/webView"
            android:layout_width="match_parent"
            android:layout_height="match_parent" />

    </androidx.swiperefreshlayout.widget.SwipeRefreshLayout>
    ` : `
    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
    `}

    <!-- Top web page loading indicator -->
    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="match_parent"
        android:layout_height="3dp"
        android:layout_alignParentTop="true"
        android:indeterminate="false"
        android:max="100"
        android:progressDrawable="@drawable/progress_bar_custom"
        android:visibility="gone" />

    <!-- Offline & Error State Screen -->
    <LinearLayout
        android:id="@+id/offlineLayout"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:orientation="vertical"
        android:gravity="center"
        android:background="#0F172A"
        android:padding="32dp"
        android:visibility="gone">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="@string/error_offline_title"
            android:textColor="@color/white"
            android:textSize="20sp"
            android:textStyle="bold"
            android:layout_marginBottom="8dp" />

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="@string/error_offline_message"
            android:textColor="#94A3B8"
            android:textSize="14sp"
            android:gravity="center"
            android:layout_marginBottom="24dp" />

        <Button
            android:id="@+id/btnRetry"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="@string/action_retry"
            android:backgroundTint="@color/primary_color"
            android:textColor="@color/white" />
    </LinearLayout>

    <!-- Splash Screen overlay -->
    <LinearLayout
        android:id="@+id/splashOverlay"
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:orientation="vertical"
        android:gravity="center"
        android:background="@color/splash_color">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="${escapeXml(config.splashText || config.appName)}"
            android:textColor="@color/white"
            android:textSize="26sp"
            android:textStyle="bold" />

        <ProgressBar
            android:layout_width="32dp"
            android:layout_height="32dp"
            android:layout_marginTop="24dp"
            android:indeterminateTint="@color/primary_color" />
    </LinearLayout>

</RelativeLayout>
`;
  files.push({ path: 'app/src/main/res/layout/activity_main.xml', content: activityMainLayout });

  // 13. Custom drawables: progress_bar_custom.xml & icon adaptive drawables
  const progressBarDrawable = `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:id="@android:id/background">
        <color android:color="#00000000" />
    </item>
    <item android:id="@android:id/progress">
        <clip>
            <color android:color="@color/primary_color" />
        </clip>
    </item>
</layer-list>
`;
  files.push({ path: 'app/src/main/res/drawable/progress_bar_custom.xml', content: progressBarDrawable });

  // Adaptive Icon XML
  const icLauncherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/primary_color" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`;
  files.push({ path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml', content: icLauncherXml });
  files.push({ path: 'app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml', content: icLauncherXml });

  // Vector foreground drawable for app icon
  const firstLetter = (config.appName.charAt(0) || 'A').toUpperCase();
  const icForegroundXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M34,28 h40 c3.3,0 6,2.7 6,6 v40 c0,3.3 -2.7,6 -6,6 h-40 c-3.3,0 -6,-2.7 -6,-6 v-40 c0,-3.3 2.7,-6 6,-6 z" />
    <path
        android:fillColor="@color/primary_color"
        android:pathData="M44,40 h20 v6 h-20 z M44,51 h20 v6 h-20 z M44,62 h14 v6 h-14 z" />
</vector>
`;
  files.push({ path: 'app/src/main/res/drawable/ic_launcher_foreground.xml', content: icForegroundXml });

  // 14. MainActivity.kt - The Heart of the Android Wrapper
  const mainActivityKt = `package ${config.packageName}

import android.annotation.SuppressLint
import android.app.AlertDialog
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.net.http.SslError
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.view.View
import android.webkit.ConsoleMessage
import android.webkit.CookieManager
import android.webkit.DownloadListener
import android.webkit.GeolocationPermissions
import android.webkit.PermissionRequest
import android.webkit.SslErrorHandler
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
${config.enablePullToRefresh ? 'import androidx.swiperefreshlayout.widget.SwipeRefreshLayout' : ''}

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var offlineLayout: LinearLayout
    private lateinit var splashOverlay: View
    private lateinit var btnRetry: Button
    ${config.enablePullToRefresh ? 'private lateinit var swipeRefreshLayout: SwipeRefreshLayout' : ''}

    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private val targetUrl = "${escapeKotlin(config.url)}"
    private val targetDomain = "${escapeKotlin(host)}"

    // File picker launcher for HTML5 <input type="file">
    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (fileUploadCallback == null) return@registerForActivityResult
        var results: Array<Uri>? = null
        if (result.resultCode == RESULT_OK && result.data != null) {
          val dataUri = result.data?.data
          val clipData = result.data?.clipData
          if (clipData != null) {
              results = Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
          } else if (dataUri != null) {
              results = arrayOf(dataUri)
          }
        }
        fileUploadCallback?.onReceiveValue(results)
        fileUploadCallback = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // View Binding / Initialization
        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        offlineLayout = findViewById(R.id.offlineLayout)
        splashOverlay = findViewById(R.id.splashOverlay)
        btnRetry = findViewById(R.id.btnRetry)
        ${config.enablePullToRefresh ? 'swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout)' : ''}

        ${config.isFullScreen ? `// Edge-to-edge / Fullscreen mode
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.hide(WindowInsetsCompat.Type.systemBars())
        controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE` : ''}

        setupWebView()
        setupBackNavigation()
        setupListeners()

        // Load initial page
        if (isNetworkAvailable()) {
            webView.loadUrl(targetUrl)
        } else {
            showOfflineView(true)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val settings = webView.settings

        // 1. Core script and DOM storage
        settings.javaScriptEnabled = ${config.enableJavaScript}
        settings.domStorageEnabled = true
        settings.databaseEnabled = true

        // 2. File and content access
        settings.allowFileAccess = ${config.allowFileAccess}
        settings.allowContentAccess = true

        // 3. Viewport & display
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.setSupportZoom(true)
        settings.builtInZoomControls = true
        settings.displayZoomControls = false

        // 4. Cache & network
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        ${config.allowCleartext ? 'settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW' : 'settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW'}

        // 5. User-Agent suffix
        val originalUA = settings.userAgentString
        settings.userAgentString = "$originalUA ${escapeKotlin(config.customUserAgentSuffix || 'URL2APK/1.0')}"

        // 6. Cookie management
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }

        // 7. WebViewClient for navigation and SSL safety
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val uri = request?.url ?: return false
                val host = uri.host ?: return false

                // Keep same domain links inside WebView
                if (host.contains(targetDomain) || targetDomain.contains(host)) {
                    return false
                }

                // Handle special schemes (tel:, mailto:, whatsapp:, intent:)
                val scheme = uri.scheme?.lowercase() ?: ""
                if (scheme == "tel" || scheme == "mailto" || scheme == "sms" || scheme == "whatsapp") {
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, uri))
                        return true
                    } catch (e: Exception) {
                        return false
                    }
                }

                // Open external links in device browser or let WebView navigate
                return false
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                progressBar.visibility = View.VISIBLE
                progressBar.progress = 15
                showOfflineView(false)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                progressBar.visibility = View.GONE
                ${config.enablePullToRefresh ? 'swipeRefreshLayout.isRefreshing = false' : ''}
                // Hide splash overlay on first successful page load
                if (splashOverlay.visibility == View.VISIBLE) {
                    splashOverlay.animate()
                        .alpha(0f)
                        .setDuration(300)
                        .withEndAction { splashOverlay.visibility = View.GONE }
                        .start()
                }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                // Show offline UI only for main frame errors
                if (request?.isForMainFrame == true) {
                    showOfflineView(true)
                }
            }

            // CRITICAL: SSL Certificate validation - Never silently ignore bad certs in release!
            override fun onReceivedSslError(
                view: WebView?,
                handler: SslErrorHandler?,
                error: SslError?
            ) {
                val errorMsg = when (error?.primaryError) {
                    SslError.SSL_EXPIRED -> "The security certificate has expired."
                    SslError.SSL_IDMISMATCH -> "The security certificate hostname does not match."
                    SslError.SSL_UNTRUSTED -> "The security certificate authority is untrusted."
                    SslError.SSL_DATE_INVALID -> "The security certificate date is invalid."
                    else -> "SSL Certificate Validation Error."
                }

                AlertDialog.Builder(this@MainActivity)
                    .setTitle(getString(R.string.ssl_warning_title))
                    .setMessage("$errorMsg\\n\\n" + getString(R.string.ssl_warning_message))
                    .setPositiveButton(getString(R.string.action_continue)) { _, _ ->
                        handler?.proceed()
                    }
                    .setNegativeButton(getString(R.string.action_go_back)) { _, _ ->
                        handler?.cancel()
                        showOfflineView(true)
                    }
                    .setCancelable(false)
                    .create()
                    .show()
            }
        }

        // 8. WebChromeClient for Progress, File Chooser, Geolocation, Camera
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                if (newProgress == 100) {
                    progressBar.visibility = View.GONE
                }
            }

            // File Chooser for <input type="file">
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "*/*"
                    addCategory(Intent.CATEGORY_OPENABLE)
                }

                return try {
                    filePickerLauncher.launch(intent)
                    true
                } catch (e: Exception) {
                    fileUploadCallback = null
                    false
                }
            }

            ${config.enableGeolocation ? `
            // Geolocation permission prompt
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                callback?.invoke(origin, true, false)
            }
            ` : ''}

            ${config.enableCamera ? `
            // Camera / WebRTC permission prompt
            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }
            ` : ''}
        }

        ${config.enableDownloadManager ? `
        // 9. Download Manager Listener for PDFs, ZIPs, APKs, and documents
        webView.setDownloadListener(DownloadListener { url, userAgent, contentDisposition, mimetype, _ ->
            try {
                val request = DownloadManager.Request(Uri.parse(url)).apply {
                    setMimeType(mimetype)
                    addRequestHeader("User-Agent", userAgent)
                    setDescription(getString(R.string.downloading_file))
                    setTitle(URLUtil.guessFileName(url, contentDisposition, mimetype))
                    setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    setDestinationInExternalPublicDir(
                        Environment.DIRECTORY_DOWNLOADS,
                        URLUtil.guessFileName(url, contentDisposition, mimetype)
                    )
                }
                val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
                dm.enqueue(request)
                Toast.makeText(applicationContext, getString(R.string.downloading_file), Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(applicationContext, "Download error: \${e.message}", Toast.LENGTH_SHORT).show()
            }
        })
        ` : ''}
    }

    private fun setupBackNavigation() {
        // Modern AndroidX OnBackPressedDispatcher (replaces deprecated onBackPressed)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    private fun setupListeners() {
        btnRetry.setOnClickListener {
            if (isNetworkAvailable()) {
                showOfflineView(false)
                webView.reload()
            } else {
                Toast.makeText(this, getString(R.string.error_offline_title), Toast.LENGTH_SHORT).show()
            }
        }

        ${config.enablePullToRefresh ? `
        // Pull-to-refresh listener
        swipeRefreshLayout.setOnRefreshListener {
            if (isNetworkAvailable()) {
                webView.reload()
            } else {
                swipeRefreshLayout.isRefreshing = false
                showOfflineView(true)
            }
        }

        // Only trigger pull-to-refresh when user is scrolled to the absolute top of the page
        webView.viewTreeObserver.addOnScrollChangedListener {
            swipeRefreshLayout.isEnabled = (webView.scrollY == 0)
        }
        ` : ''}
    }

    private fun showOfflineView(show: Boolean) {
        offlineLayout.visibility = if (show) View.VISIBLE else View.GONE
        webView.visibility = if (show) View.GONE else View.VISIBLE
        if (show) {
            progressBar.visibility = View.GONE
            splashOverlay.visibility = View.GONE
        }
    }

    private fun isNetworkAvailable(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return false
        val capabilities = cm.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    override fun onDestroy() {
        webView.stopLoading()
        webView.destroy()
        super.onDestroy()
    }
}
`;
  files.push({ path: `app/src/main/java/${packageDir}/MainActivity.kt`, content: mainActivityKt });

  // 15. GitHub Actions Workflow (.github/workflows/build-apk.yml)
  const githubWorkflow = `name: Build Android APK (URL2APK)

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: gradle

      - name: Grant execute permission for gradlew
        run: chmod +x gradlew

      - name: Generate Debug Keystore if missing
        run: |
          mkdir -p app/keystore
          if [ ! -f app/keystore/debug.keystore ]; then
            keytool -genkey -v -keystore app/keystore/debug.keystore -storepass androiddebugkey -alias androiddebugkey -keypass androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
          fi

      - name: Build with Gradle
        run: ./gradlew assembleRelease --stacktrace

      - name: Upload Release APK
        uses: actions/upload-artifact@v4
        with:
          name: ${config.appName.replace(/[^a-zA-Z0-9_-]/g, '')}-release-apk
          path: app/build/outputs/apk/release/*.apk
          retention-days: 14
`;
  files.push({ path: '.github/workflows/build-apk.yml', content: githubWorkflow });

  // 16. README.md with comprehensive instructions
  const readme = `# ${config.appName} - Android WebView App

Generated by **URL2APK**.

- **Target URL**: \`${config.url}\`
- **Package Name**: \`${config.packageName}\`
- **Target SDK**: \`35\` (Android 15)
- **Min SDK**: \`24\` (Android 7.0+)
- **Build Tool**: Gradle 8.7 with Android Gradle Plugin 8.5.2

---

## 🚀 How to Build the APK

### Option 1: One-Click Cloud Build with GitHub Actions (Recommended)
1. Push this folder to a GitHub repository.
2. Go to the **Actions** tab in your repository.
3. The **"Build Android APK"** workflow runs automatically.
4. When finished, download the compiled, signed \`.apk\` artifact directly from GitHub!

### Option 2: Build Locally with Command Line
Prerequisites: JDK 17 installed (\`javac -version\`).

\`\`\`bash
# 1. Grant execute permission
chmod +x gradlew

# 2. Build Release APK
./gradlew assembleRelease

# The generated APK will be at:
# app/build/outputs/apk/release/app-release.apk
\`\`\`

### Option 3: Open in Android Studio
1. Launch **Android Studio** (Hedgehog or newer).
2. Click **Open** and select this directory.
3. Wait for Gradle Sync to complete.
4. Select **Build > Build Bundle(s) / APK(s) > Build APK(s)** or click the green **Run** button to test on an emulator or physical device.

---

## 🔐 Keystore & Play Store Signing

For internal testing, this project uses a standard debug keystore.
To generate a production signing key for Google Play upload:

\`\`\`bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.p12 -alias my-alias -keyalg RSA -keysize 2048 -validity 10000
\`\`\`

Update \`app/build.gradle.kts\` with your keystore path, alias, and environment variable passwords.

---

## 📋 Features Included
- Native back navigation handling with \`OnBackPressedCallback\`.
- SSL security checks with user warning dialog (no silent cert ignores).
- HTML5 File Chooser (\`<input type="file">\`) via Android \`ActivityResultLauncher\`.
- ${config.enablePullToRefresh ? 'Swipe-to-refresh with top-scroll detection.' : 'Swipe-to-refresh disabled.'}
- ${config.enableDownloadManager ? 'Android DownloadManager integration for PDFs and files.' : 'Download manager disabled.'}
- ${config.enableGeolocation ? 'HTML5 Geolocation permissions integration.' : 'Geolocation disabled.'}
- ${config.enableCamera ? 'Camera permissions integration for WebRTC/photo capture.' : 'Camera disabled.'}
- Network reachability monitor and offline retry screen.
`;
  files.push({ path: 'README.md', content: readme });

  // Key previews for UI Code Inspector
  const previews: Record<string, string> = {
    'MainActivity.kt': mainActivityKt,
    'AndroidManifest.xml': androidManifest,
    'app/build.gradle.kts': appBuildGradle,
    'activity_main.xml': activityMainLayout,
    'network_security_config.xml': networkSecurityConfig,
    '.github/workflows/build-apk.yml': githubWorkflow,
    'README.md': readme
  };

  return {
    files,
    previews,
    workflow: githubWorkflow,
    readme
  };
}
