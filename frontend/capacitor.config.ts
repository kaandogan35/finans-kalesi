import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.paramgo.app',
  appName: 'ParamGo',
  webDir: '../public/frontend-build',
  server: {
    // iOS'ta CORS sorunlarını önlemek için hostname ayarla
    hostname: 'localhost',
    androidScheme: 'https',
    iosScheme: 'capacitor',
    allowNavigation: ['paramgo.com', 'kaandogan.com.tr'],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#F8F9FA',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#10B981',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  ios: {
    scheme: 'ParamGo',
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#F8F9FA',
  },
}

export default config
