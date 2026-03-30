import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.paramgo.app',
  appName: 'ParamGo',
  webDir: '../public/frontend-build',
  server: {
    hostname: 'localhost',
    androidScheme: 'https',
    iosScheme: 'capacitor',
    allowNavigation: ['paramgo.com', 'kaandogan.com.tr'],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#0B1120',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
    },
    Keyboard: {
      resize: 'none',
      resizeOnFullScreen: false,
    },
  },
  ios: {
    scheme: 'ParamGo',
    contentInset: 'never',
    backgroundColor: '#0B1120',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#F8F9FA',
  },
}

export default config
