import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.paramgo.app',
  appName: 'ParamGo',
  webDir: '../public/frontend-build',
  server: {
    // Production'da webDir kullanılır
    // Development'ta aşağıyı aktif et:
    // url: 'http://localhost:3000',
    // cleartext: true,
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
