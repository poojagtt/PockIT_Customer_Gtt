// import UIKit
// import React
// import React_RCTAppDelegate
// import ReactAppDependencyProvider
// import Razorpay
// import Firebase
// import GoogleMaps



// @main
// class AppDelegate: RCTAppDelegate {
//   override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
//   FirebaseApp.configure()
  
//         GMSServices.provideAPIKey("AIzaSyA1EJJ0RMDQwzsDd00Oziy1pytYn_Ozi-g")

//     self.moduleName = "PockITCust"
//     self.dependencyProvider = RCTAppDependencyProvider()

//     // You can add your custom initial props in the dictionary below.
//     // They will be passed down to the ViewController used by React Native.
//     self.initialProps = [:]

//     return super.application(application, didFinishLaunchingWithOptions: launchOptions)
//   }

//   override func sourceURL(for bridge: RCTBridge) -> URL? {
//     self.bundleURL()
//   }

//   override func bundleURL() -> URL? {
// #if DEBUG
//     RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
// #else
//     Bundle.main.url(forResource: "main", withExtension: "jsbundle")
// #endif
//   }
// }



import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Razorpay
import Firebase
import GoogleMaps
import UserNotifications

@main
class AppDelegate: RCTAppDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {

  override func application(_ application: UIApplication,
                            didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    FirebaseApp.configure()
    GMSServices.provideAPIKey("AIzaSyBch51HSSKjdBT1_doeapN6s46i4iCSeDw")

    // Register for push notifications
    UNUserNotificationCenter.current().delegate = self
    let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
    UNUserNotificationCenter.current().requestAuthorization(options: authOptions, completionHandler: { _, _ in })
    application.registerForRemoteNotifications()
    Messaging.messaging().delegate = self

    self.moduleName = "PockITCust"
    self.dependencyProvider = RCTAppDependencyProvider()
    self.initialProps = [:]

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }

  // Register APNs token
  override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    Messaging.messaging().apnsToken = deviceToken
  }

  // Handle new FCM token
  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    print("FCM registration token: \(String(describing: fcmToken))")
  }

  // Foreground notification handling (optional)
  func userNotificationCenter(_ center: UNUserNotificationCenter,
                              willPresent notification: UNNotification,
                              withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([.banner, .sound, .badge])
  }
}
