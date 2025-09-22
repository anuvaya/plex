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

    AsyncFunction("checkForUpdate") { (options: [String: Any]?, promise: Promise) in
      let localVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? ""
      let optAppId = options?["appStoreId"] as? String
      let optBundle = options?["bundleId"] as? String
      let country = options?["countryCode"] as? String

      var components = URLComponents(string: "https://itunes.apple.com/lookup")
      var queryItems: [URLQueryItem] = []
      if let appId = optAppId, !appId.isEmpty {
        queryItems.append(URLQueryItem(name: "id", value: appId))
      } else if let bundleOverride = optBundle, !bundleOverride.isEmpty {
        queryItems.append(URLQueryItem(name: "bundleId", value: bundleOverride))
      } else if let bundleId = Bundle.main.bundleIdentifier {
        queryItems.append(URLQueryItem(name: "bundleId", value: bundleId))
      }
      if let country = country, !country.isEmpty {
        queryItems.append(URLQueryItem(name: "country", value: country))
      }
      components?.queryItems = queryItems
      guard let url = components?.url else {
        promise.resolve([
          "platform": "ios",
          "isAvailable": false,
          "recommendedType": "none",
          "localVersion": localVersion,
        ])
        return
      }

      URLSession.shared.dataTask(with: url) { data, _, error in
        guard error == nil, let data = data else {
          promise.resolve([
            "platform": "ios",
            "isAvailable": false,
            "recommendedType": "none",
            "localVersion": localVersion,
          ])
          return
        }

        var remoteVersion: String? = nil
        var storeUrl: String? = nil
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let results = json["results"] as? [[String: Any]],
           let first = results.first {
          if let v = first["version"] as? String { remoteVersion = v }
          if let u = first["trackViewUrl"] as? String { storeUrl = u }
        }

        let isAvailable: Bool = {
          guard let remote = remoteVersion else { return false }
          return self.isRemoteVersionNewer(remote, than: localVersion)
        }()

        var result: [String: Any] = [
          "platform": "ios",
          "isAvailable": isAvailable,
          "recommendedType": isAvailable ? "store" : "none",
          "localVersion": localVersion,
        ]
        if let remoteVersion = remoteVersion { result["remoteVersion"] = remoteVersion }
        if let storeUrl = storeUrl { result["storeUrl"] = storeUrl }
        promise.resolve(result)
      }.resume()
    }

    AsyncFunction("startUpdate") { (options: [String: Any]?, promise: Promise) in
      let optAppId = options?["appStoreId"] as? String
      let optBundle = options?["bundleId"] as? String
      let country = (options?["countryCode"] as? String)?.lowercased()

      // If appStoreId is provided, construct an itms-apps URL directly (more reliable)
      if let appId = optAppId, !appId.isEmpty {
        let countryPath = (country != nil && !country!.isEmpty) ? "/\(country!)" : ""
        let itmsUrl = URL(string: "itms-apps://apps.apple.com\(countryPath)/app/id\(appId)")
        let httpsUrl = URL(string: "https://apps.apple.com\(countryPath)/app/id\(appId)")
        DispatchQueue.main.async {
          if let u = itmsUrl {
            UIApplication.shared.open(u, options: [:]) { success in
              if success {
                promise.resolve(["started": true])
              } else if let alt = httpsUrl {
                UIApplication.shared.open(alt, options: [:]) { success2 in
                  promise.resolve(["started": success2])
                }
              } else {
                promise.resolve(["started": false])
              }
            }
          } else if let alt = httpsUrl {
            UIApplication.shared.open(alt, options: [:]) { success in
              promise.resolve(["started": success])
            }
          } else {
            promise.resolve(["started": false])
          }
        }
        return
      }

      // Otherwise, lookup by bundleId and open the trackViewUrl
      var components = URLComponents(string: "https://itunes.apple.com/lookup")
      var queryItems: [URLQueryItem] = []
      if let bundleOverride = optBundle, !bundleOverride.isEmpty {
        queryItems.append(URLQueryItem(name: "bundleId", value: bundleOverride))
      } else if let bundleId = Bundle.main.bundleIdentifier {
        queryItems.append(URLQueryItem(name: "bundleId", value: bundleId))
      }
      if let country = country, !country.isEmpty {
        queryItems.append(URLQueryItem(name: "country", value: country))
      }
      components?.queryItems = queryItems
      guard let url = components?.url else {
        promise.resolve(["started": false])
        return
      }

      URLSession.shared.dataTask(with: url) { data, _, error in
        guard error == nil, let data = data,
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let results = json["results"] as? [[String: Any]],
              let first = results.first,
              let storeUrlStr = first["trackViewUrl"] as? String else {
          promise.resolve(["started": false])
          return
        }

        // Try itms-apps first, fallback to https
        let transformed = storeUrlStr.replacingOccurrences(of: "https://", with: "itms-apps://")
        let itmsUrl = URL(string: transformed)
        let httpsUrl = URL(string: storeUrlStr)

        DispatchQueue.main.async {
          if let u = itmsUrl {
            UIApplication.shared.open(u, options: [:]) { success in
              if success {
                promise.resolve(["started": true])
              } else if let alt = httpsUrl {
                UIApplication.shared.open(alt, options: [:]) { success2 in
                  promise.resolve(["started": success2])
                }
              } else {
                promise.resolve(["started": false])
              }
            }
          } else if let alt = httpsUrl {
            UIApplication.shared.open(alt, options: [:]) { success in
              promise.resolve(["started": success])
            }
          } else {
            promise.resolve(["started": false])
          }
        }
      }.resume()
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

  // Compare dotted numeric version strings (e.g., "1.2.10" > "1.2.3")
  private func isRemoteVersionNewer(_ remote: String, than local: String) -> Bool {
    let r = remote.split(separator: ".").compactMap { Int($0) }
    let l = local.split(separator: ".").compactMap { Int($0) }
    let count = max(r.count, l.count)
    for i in 0..<count {
      let rv = i < r.count ? r[i] : 0
      let lv = i < l.count ? l[i] : 0
      if rv != lv { return rv > lv }
    }
    return false
  }
}
