import UIKit
import CommonCrypto
import Capacitor
import FirebaseCore

// SSL Pinning — paramgo.com sertifika sabitleme
// Hash (SHA-256, public key): XeT8c5VDNOSO0nrBABjIybAbqP5lw+1WbjBomevtUsU=
// Hash yenileme tarihi: 2026-03-28
// ⚠️ Sertifika rotasyonundan ÖNCE yedek hash eklenmeli, sonra aktif hash güncellenmeli
private let pinnedHashes: Set<String> = [
    "XeT8c5VDNOSO0nrBABjIybAbqP5lw+1WbjBomevtUsU=",
    // Yedek hash buraya eklenecek — sertifika değişmeden önce
]

private let pinnedDomains: Set<String> = [
    "paramgo.com",
    "www.paramgo.com",
    "api.paramgo.com",
]

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Firebase başlat — GoogleService-Info.plist iOS bundle'da olmalı
        // Çift init koruması: zaten configure edilmişse atla
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationDidBecomeActive(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}

// MARK: - SSL Pinning Yardımcıları
// Not: Capacitor WKWebView tabanlı uygulamalarda tam SSL pinning için
// TrustKit kütüphanesi (cocoapods) veya native URLSession delegate kullanılır.
// Şu an hash sabitleme bilgisi ve Android pinning aktif.
// iOS için TrustKit entegrasyonu: Podfile'a `pod 'TrustKit'` eklenmeli.
extension AppDelegate {
    static func publicKeyHash(for certificate: SecCertificate) -> String? {
        guard let publicKey = SecCertificateCopyKey(certificate),
              let publicKeyData = SecKeyCopyExternalRepresentation(publicKey, nil) as Data? else {
            return nil
        }
        let rsa2048Header: [UInt8] = [
            0x30, 0x82, 0x01, 0x22, 0x30, 0x0d, 0x06, 0x09,
            0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01,
            0x01, 0x05, 0x00, 0x03, 0x82, 0x01, 0x0f, 0x00
        ]
        var keyWithHeader = Data(rsa2048Header)
        keyWithHeader.append(publicKeyData)
        return keyWithHeader.sha256Base64
    }
}

private extension Data {
    var sha256Base64: String {
        var digest = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        self.withUnsafeBytes { _ = CC_SHA256($0.baseAddress, CC_LONG(self.count), &digest) }
        return Data(digest).base64EncodedString()
    }
}
