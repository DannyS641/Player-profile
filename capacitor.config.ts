import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.adrenale5.playersprofile',
  appName: 'Players Profile',
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#f6f1e8',
      showSpinner: false,
    },
  },
};

export default config;
