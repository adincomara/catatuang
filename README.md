# CatatUang - Personal Finance Mobile Web App

Aplikasi pencatatan keuangan pribadi yang dioptimalkan untuk tampilan mobile, WebView Android, dan WKWebView iOS.

## ✨ Fitur Utama
- **Dashboard Ringkasan:** Total saldo bersih, total pemasukan vs pengeluaran bulan berjalan, dan daftar dompet aktif.
- **Multi-Dompet / Akun:** Manajemen kas tunai, rekening bank (BCA, Mandiri, dll.), dan e-wallet (GoPay, OVO, ShopeePay, dll.).
- **Pencatatan Cepat Transaksi:**
  - Kategori lengkap dengan ikon/emoji khas kebutuhan Indonesia (Makanan, Bensin/Transport, Belanja, Tagihan, Gaji, dll.).
  - Tombol nominal instan (+10rb, +20rb, +50rb, +100rb, +500rb).
  - Pemasukan, Pengeluaran, dan Transfer antar dompet.
- **Riwayat & Filter:** Pengelompokan riwayat per hari, pencarian teks, dan filter berdasarkan tipe atau dompet.
- **Statistik & Analisis:** Donut chart kategori pengeluaran (berbasis Chart.js lokal) dan analisis persentase alokasi dana.
- **Mode Gelap / Terang:** Mendukung preferensi UI modern.
- **Cadangan Data:** Ekspor & Impor JSON, serta ekspor transaksi ke CSV/Excel.
- **100% Offline-First:** Semua aset (CSS, Chart.js, Vector Icon) tersimpan lokal tanpa ketergantungan koneksi internet.

---

## 🚀 Menjalankan Secara Lokal / Development
Jalankan server HTTP lokal di dalam direktori `finance-app`:

```bash
cd finance-app
python3 -m http.server 8080
```
Buka browser di `http://localhost:8080`.

---

## 📱 Integrasi ke Android WebView (Java / Kotlin)

### 1. Letakkan Berkas
Salin seluruh file di dalam folder `finance-app/` ke dalam folder asset proyek Android Studio:
`app/src/main/assets/`

### 2. Berikan Izin di `AndroidManifest.xml` (Opsional jika ingin akses offline murni)
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

### 3. Konfigurasi `MainActivity.kt`
```kotlin
package com.example.catatuang

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        webView.webViewClient = WebViewClient()
        webView.webChromeClient = WebChromeClient()

        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true // Wajib untuk localStorage
        settings.databaseEnabled = true
        settings.allowFileAccess = true

        webView.loadUrl("file:///android_asset/index.html")
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
```

---

## 🍏 Integrasi ke iOS WKWebView (Swift)

### 1. Letakkan Berkas
Drag & drop folder `finance-app` ke dalam proyek Xcode Anda (pilih *"Create folder references"*).

### 2. Kode `ViewController.swift`
```swift
import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        
        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        
        view.addSubview(webView)

        if let htmlPath = Bundle.main.path(forResource: "index", ofType: "html", inDirectory: "finance-app") {
            let fileURL = URL(fileURLWithPath: htmlPath)
            let folderURL = fileURL.deletingLastPathComponent()
            webView.loadFileURL(fileURL, allowingReadAccessTo: folderURL)
        }
    }
}
```

---

## ⚡ Opsi Alternatif: Build APK & iOS App via Capacitor
Jika ingin membuat build native Android (`.apk`) dan iOS dengan satu perintah:

```bash
cd finance-app
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init CatatUang com.catatuang.app --web-dir .
npx cap add android
npx cap add ios
npx cap open android
```
