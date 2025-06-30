import ExpoModulesCore
import UIKit

public class PlexModule: Module {
  private let paymentApps: [(scheme: String, name: String)] = [
    ("tez", "Google Pay"),
    ("phonepe", "PhonePe"),
    ("paytmmp", "Paytm"),
    ("credpay", "CRED"),
    ("mobikwik", "MobiKwik"),
    ("freecharge", "FreeCharge"),
    ("in.fampay.app", "FamPay"),
    ("bhim", "BHIM"),
    ("amazonpay", "Amazon Pay"),
    ("navi", "Navi"),
    ("kiwi", "Kiwi"),
    ("payzapp", "PayZapp"),
    ("jupiter", "Jupiter"),
    ("omnicard", "Omni Card"),
    ("icici", "iMobile Pay"),
    ("popclubapp", "PopClub"),
    ("sbiyono", "YONO SBI"),
    ("myjio", "MyJio"),
    ("slice-upi", "Slice"),
    ("bobupi", "Bank of Baroda UPI"),
    ("shriramone", "Shriram One"),
    ("indusmobile", "IndusInd Bank"),
    ("whatsapp", "WhatsApp"),
  ]

  public func definition() -> ModuleDefinition {
    Name("Plex")

    AsyncFunction("getPaymentContext") { () -> [String: Any] in
      let installedApps = self.detectInstalledPaymentApps()
      return [
        "installedApps": installedApps,
        "totalAppsChecked": self.paymentApps.count,
        "detectionMethod": "url_scheme",
      ]
    }

    View(PlexView.self) {
      Prop("url") { (view: PlexView, url: URL) in
        if view.webView.url != url {
          view.webView.load(URLRequest(url: url))
        }
      }
      Events("onLoad")
    }
  }

  private func detectInstalledPaymentApps() -> [[String: Any]] {
    var installedApps: [[String: Any]] = []

    for app in paymentApps {
      let scheme = app.scheme
      let name = app.name

      // Create URL with scheme
      guard let url = URL(string: "\(scheme)://") else {
        continue
      }

      // Check if app can handle this URL scheme
      let isInstalled = UIApplication.shared.canOpenURL(url)

      let appInfo: [String: Any] = [
        "scheme": scheme,
        "name": name,
        "isInstalled": isInstalled,
        "packageName": scheme,  // Using scheme as identifier for now
      ]

      installedApps.append(appInfo)
    }

    return installedApps
  }
}
