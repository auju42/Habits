# Android App Guide

## 1. Initial Setup (One Time)

### Install Android Studio
1.  Download **Android Studio** from [developer.android.com/studio](https://developer.android.com/studio).
2.  Run the installer. Keep all default options checked (especially "Android Virtual Device" and "Android SDK").
3.  Open Android Studio. It may ask to download "SDK Components" – let it do that.

### Open the Project
1.  In Android Studio, click **Open**.
2.  Navigate to your project folder: `C:\Projects\Habits\`.
3.  **Important**: Select the `android` folder *inside* it (`C:\Projects\Habits\android`) and click OK.
4.  Wait. You will see bars loading at the bottom right. This is "Gradle Sync". It might take 10+ minutes the first time.

---

## 2. Generating the APK (To install on your phone)

Whenever you want to create an app file to install:

1.  **Open the project** in Android Studio (if not already open).
2.  On the top menu bar, click **Build**.
3.  Select **Build Bundle(s) / APK(s)** > **Build APK(s)**.
4.  Wait for the build to finish.
5.  A small popup will appear in the bottom right saying "APK(s) generated successfully".
6.  Click **locate** in that popup.
7.  It will open a folder containing `app-debug.apk`.
8.  **Send this file to your phone** (via USB, Google Drive, WhatsApp, etc.).
9.  Open it on your phone and click **Install**. 
    *   *Note: You may need to "Allow installation from unknown sources".*

---

## 3. How Updates Work

**Q: Do I have to redo this when I push to Vercel?**
**A: YES.** 

*   **Vercel** updates the *website* (what people see in Chrome/Safari).
*   **The Android App** is a self-contained copy of your code. It does *not* automatically pull updates from Vercel.

**To update the Android App:**
1.  Make your code changes.
2.  Run this command in your terminal:
    ```bash
    npm run build
    npx cap sync
    ```
    *(This updates the Android project with your latest Javascript/React code)*
3.  Go to Android Studio and **Build APK** again (Step 2 above).
4.  Install the new APK on your phone (it will update the existing one).

> **Note on Data**: Your **Data (Habits, History, etc.)** IS shared. It lives in Firebase. So if you check off a habit on the website, it WILL update on the Android app immediately, even if the app code is old. Only *new features* or *bug fixes* require a new APK.
