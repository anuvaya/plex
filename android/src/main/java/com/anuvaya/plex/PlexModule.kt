package com.anuvaya.plex

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.content.pm.PackageManager
import android.content.pm.ApplicationInfo

class PlexModule : Module() {
  private val paymentApps = listOf(
    PaymentAppInfo("com.google.android.apps.nfc.payment", "Google Pay", "tez"),
    PaymentAppInfo("com.phonepe.app", "PhonePe", "phonepe"),
    PaymentAppInfo("net.one97.paytm", "Paytm", "paytmmp"),
    PaymentAppInfo("com.credavenue.cred", "CRED", "credpay"),
    PaymentAppInfo("com.mobikwik_new", "MobiKwik", "mobikwik"),
    PaymentAppInfo("com.freecharge.android", "FreeCharge", "freecharge"),
    PaymentAppInfo("in.fampay.app", "FamPay", "in.fampay.app"),
    PaymentAppInfo("in.org.npci.upiapp", "BHIM", "bhim"),
    PaymentAppInfo("in.amazon.mShop.android.shopping", "Amazon Pay", "amazonpay"),
    PaymentAppInfo("com.naviapp", "Navi", "navi"),
    PaymentAppInfo("com.axis.mobile", "Axis Mobile", "kiwi"),
    PaymentAppInfo("com.enstage.wibmo.hdfc", "PayZapp", "payzapp"),
    PaymentAppInfo("money.jupiter.app", "Jupiter", "jupiter"),
    PaymentAppInfo("com.csam.icici.bank.imobile", "iMobile Pay", "icici"),
    PaymentAppInfo("com.sbi.lotza.mbanking", "YONO SBI", "sbiyono"),
    PaymentAppInfo("com.jio.myjio", "MyJio", "myjio"),
    PaymentAppInfo("com.sliceit.android", "Slice", "slice-upi"),
    PaymentAppInfo("com.barodampay.app", "Bank of Baroda UPI", "bobupi"),
    PaymentAppInfo("com.whatsapp", "WhatsApp", "whatsapp")
  )

  data class PaymentAppInfo(
    val packageName: String,
    val displayName: String,
    val scheme: String
  )

  override fun definition() = ModuleDefinition {
    Name("Plex")

    AsyncFunction("getPaymentContext") {
      val installedApps = detectInstalledPaymentApps()
      mapOf(
        "installedApps" to installedApps,
        "totalAppsChecked" to paymentApps.size,
        "detectionMethod" to "package_manager"
      )
    }

    View(PlexView::class) {
      Prop("url") { view: PlexView, url: java.net.URL ->
        view.webView.loadUrl(url.toString())
      }
      Events("onLoad")
    }
  }

  private fun detectInstalledPaymentApps(): List<Map<String, Any>> {
    val installedApps = mutableListOf<Map<String, Any>>()
    val packageManager = appContext.reactContext?.packageManager ?: return installedApps

    for (app in paymentApps) {
      val isInstalled = try {
        packageManager.getPackageInfo(app.packageName, PackageManager.GET_META_DATA)
        true
      } catch (e: PackageManager.NameNotFoundException) {
        false
      }

      val appInfo = mapOf(
        "scheme" to app.scheme,
        "name" to app.displayName,
        "isInstalled" to isInstalled,
        "packageName" to app.packageName
      )

      installedApps.add(appInfo)
    }

    return installedApps
  }
}
