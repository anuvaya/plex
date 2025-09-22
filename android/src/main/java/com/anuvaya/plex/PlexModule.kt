package com.anuvaya.plex

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import android.content.pm.PackageManager
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.UpdateAvailability
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.InstallStatus

class PlexModule : Module() {
  private val paymentApps = listOf(
    PaymentAppInfo("com.google.android.apps.nbu.paisa.user", "Google Pay", "tez"),
    PaymentAppInfo("com.phonepe.app", "PhonePe", "phonepe"),
    PaymentAppInfo("net.one97.paytm", "Paytm", "paytmmp"),
    PaymentAppInfo("com.dreamplug.androidapp", "CRED", "credpay"),
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

    AsyncFunction("checkForUpdate") { options: Map<String, Any?>?, promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.resolve(
          mapOf(
            "platform" to "android",
            "isAvailable" to false,
            "recommendedType" to "none",
            "localVersion" to ""
          )
        )
        return@AsyncFunction
      }

      val pm = context.packageManager
      val localVersion = try {
        val pInfo = pm.getPackageInfo(context.packageName, 0)
        pInfo.versionName ?: ""
      } catch (e: Exception) { "" }

      val manager: AppUpdateManager = AppUpdateManagerFactory.create(context)
      val task = manager.appUpdateInfo
      task.addOnSuccessListener { info ->
        val availability = info.updateAvailability()
        var recommended = "none"
        var isAvailable = false
        if (availability == UpdateAvailability.UPDATE_AVAILABLE) {
          isAvailable = true
          recommended = when {
            info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE) -> "immediate"
            info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE) -> "flexible"
            else -> "none"
          }
        }

        val data = mutableMapOf<String, Any?>(
          "platform" to "android",
          "isAvailable" to isAvailable,
          "recommendedType" to recommended,
          "localVersion" to localVersion,
        )

        // Provide version code if available
        try {
          val code = info.availableVersionCode()
          data["remoteVersion"] = code
        } catch (_: Exception) {}

        promise.resolve(data)
      }
      task.addOnFailureListener { e ->
        promise.resolve(
          mapOf(
            "platform" to "android",
            "isAvailable" to false,
            "recommendedType" to "none",
            "localVersion" to localVersion
          )
        )
      }
    }

    AsyncFunction("startUpdate") { options: Map<String, Any?>?, promise: Promise ->
      val context = appContext.currentActivity ?: appContext.reactContext
      val activity = appContext.currentActivity
      if (context == null || activity == null) {
        promise.resolve(mapOf("started" to false))
        return@AsyncFunction
      }

      val manager: AppUpdateManager = AppUpdateManagerFactory.create(context)
      val task = manager.appUpdateInfo
      task.addOnSuccessListener { info ->
        if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE) {
          promise.resolve(mapOf("started" to false))
          return@addOnSuccessListener
        }

        val requestedType = when ((options?.get("type") as? String)?.lowercase()) {
          "immediate" -> AppUpdateType.IMMEDIATE
          "flexible" -> AppUpdateType.FLEXIBLE
          else -> null
        }

        val type = when {
          requestedType != null && info.isUpdateTypeAllowed(requestedType) -> requestedType
          info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE) -> AppUpdateType.IMMEDIATE
          info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE) -> AppUpdateType.FLEXIBLE
          else -> null
        }

        if (type == null) {
          promise.resolve(mapOf("started" to false))
          return@addOnSuccessListener
        }

        if (type == AppUpdateType.FLEXIBLE) {
          // For flexible updates, auto-complete when downloaded
          // Use object expression so we can unregister self
          val objListener = object : InstallStateUpdatedListener {
            override fun onStateUpdate(state: com.google.android.play.core.install.InstallState) {
              when (state.installStatus()) {
                InstallStatus.DOWNLOADED -> {
                  manager.completeUpdate()
                  manager.unregisterListener(this)
                }
                InstallStatus.INSTALLED, InstallStatus.FAILED, InstallStatus.CANCELED -> {
                  manager.unregisterListener(this)
                }
                else -> {}
              }
            }
          }
          manager.registerListener(objListener)
        }

        try {
          // Request code can be any integer; we don't need the result here
          val REQUEST_CODE = 17362
          manager.startUpdateFlowForResult(
            info,
            type,
            activity,
            REQUEST_CODE
          )
          promise.resolve(mapOf("started" to true))
        } catch (e: Exception) {
          promise.resolve(mapOf("started" to false))
        }
      }
      task.addOnFailureListener {
        promise.resolve(mapOf("started" to false))
      }
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
