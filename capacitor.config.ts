import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.novadental.app",
  appName: "Nexus Clinic",
  webDir: "dist",
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#7c3aed",
      showSpinner: false,
      androidSpinnerStyle: "small",
      spinnerColor: "#ffffff",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#7c3aed",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scheme: "Nexus Clinic",
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
