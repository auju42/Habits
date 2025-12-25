import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.stride',
  appName: 'Stride',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#3B82F6',
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '183255939378-g58pvmqmuujm7nhsu5ptrl5rl5oitc5f.apps.googleusercontent.com', // Web Client ID from google-services.json
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
